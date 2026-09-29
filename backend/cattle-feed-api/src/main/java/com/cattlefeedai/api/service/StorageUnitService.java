package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.SensorReadingRequest;
import com.cattlefeedai.api.dto.SensorReadingResponse;
import com.cattlefeedai.api.dto.StorageMonitoringSummaryDto;
import com.cattlefeedai.api.dto.StorageUnitRequest;
import com.cattlefeedai.api.dto.StorageUnitResponse;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.SensorReading;
import com.cattlefeedai.api.entity.StorageUnit;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.MonitoringStatus;
import com.cattlefeedai.api.entity.enums.SensorSource;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.AlertRepository;
import com.cattlefeedai.api.repository.FarmRepository;
import com.cattlefeedai.api.repository.SensorReadingRepository;
import com.cattlefeedai.api.repository.StorageUnitRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service managing storage units and sensor telemetry.
 * Enforces per-farmer ownership:
 * - Farmer A cannot access Farmer B's storage units or sensor readings (403 Forbidden).
 * - Missing storage units return 404 Not Found.
 */
@Service
@Transactional
public class StorageUnitService {

    private final StorageUnitRepository storageUnitRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final FarmRepository farmRepository;
    private final AlertRepository alertRepository;
    private final StorageMonitoringService storageMonitoringService;
    private final SecurityUtils securityUtils;

    public StorageUnitService(
            StorageUnitRepository storageUnitRepository,
            SensorReadingRepository sensorReadingRepository,
            FarmRepository farmRepository,
            AlertRepository alertRepository,
            StorageMonitoringService storageMonitoringService,
            SecurityUtils securityUtils
    ) {
        this.storageUnitRepository = storageUnitRepository;
        this.sensorReadingRepository = sensorReadingRepository;
        this.farmRepository = farmRepository;
        this.alertRepository = alertRepository;
        this.storageMonitoringService = storageMonitoringService;
        this.securityUtils = securityUtils;
    }

    /**
     * Create a new StorageUnit under an owned farm.
     */
    public StorageUnitResponse createStorageUnit(StorageUnitRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found with id: " + request.getFarmId()));

        validateFarmOwnership(farm, currentUser);

        StorageUnit unit = new StorageUnit();
        unit.setName(request.getName());
        unit.setStorageType(request.getStorageType());
        unit.setLocation(request.getLocation());
        unit.setCapacity(request.getCapacity());
        unit.setDeviceId(request.getDeviceId());
        unit.setFarm(farm);

        StorageUnit saved = storageUnitRepository.save(unit);
        return enrichResponse(saved);
    }

    /**
     * Retrieve all storage units belonging to the authenticated farmer, optionally filtered by farmId.
     */
    @Transactional(readOnly = true)
    public List<StorageUnitResponse> getAllStorageUnits(Long farmId) {
        User currentUser = securityUtils.getCurrentUser();
        List<StorageUnit> units;

        if (farmId != null) {
            Farm farm = farmRepository.findById(farmId)
                    .orElseThrow(() -> new ResourceNotFoundException("Farm not found with id: " + farmId));
            validateFarmOwnership(farm, currentUser);
            units = storageUnitRepository.findByFarmId(farmId);
        } else {
            if (securityUtils.isAdmin(currentUser)) {
                units = storageUnitRepository.findAll();
            } else {
                units = storageUnitRepository.findByFarmOwnerId(currentUser.getId());
            }
        }

        return units.stream()
                .map(this::enrichResponse)
                .toList();
    }

    /**
     * Retrieve a specific storage unit by ID.
     */
    @Transactional(readOnly = true)
    public StorageUnitResponse getStorageUnitById(Long id) {
        StorageUnit unit = findAndValidateStorageUnit(id);
        return enrichResponse(unit);
    }

    /**
     * Update storage unit metadata.
     */
    public StorageUnitResponse updateStorageUnit(Long id, StorageUnitRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        StorageUnit unit = findAndValidateStorageUnit(id);

        if (request.getFarmId() != null && !request.getFarmId().equals(unit.getFarm().getId())) {
            Farm newFarm = farmRepository.findById(request.getFarmId())
                    .orElseThrow(() -> new ResourceNotFoundException("Farm not found with id: " + request.getFarmId()));
            validateFarmOwnership(newFarm, currentUser);
            unit.setFarm(newFarm);
        }

        unit.setName(request.getName());
        unit.setStorageType(request.getStorageType());
        unit.setLocation(request.getLocation());
        unit.setCapacity(request.getCapacity());
        if (request.getDeviceId() != null) {
            unit.setDeviceId(request.getDeviceId());
        }

        StorageUnit updated = storageUnitRepository.save(unit);
        return enrichResponse(updated);
    }

    /**
     * Delete storage unit and its associated sensor telemetry.
     */
    public void deleteStorageUnit(Long id) {
        StorageUnit unit = findAndValidateStorageUnit(id);
        List<SensorReading> readings = sensorReadingRepository.findByStorageUnitId(id);
        if (!readings.isEmpty()) {
            sensorReadingRepository.deleteAll(readings);
        }
        storageUnitRepository.delete(unit);
    }

    /**
     * Record a new sensor reading (telemetry ingestion from ESP32 or manual).
     * Triggers evaluation by StorageMonitoringService to generate deduplicated alerts.
     */
    public SensorReadingResponse recordSensorReading(Long storageUnitId, SensorReadingRequest request) {
        StorageUnit unit = findAndValidateStorageUnit(storageUnitId);

        Optional<SensorReading> previousReading = sensorReadingRepository.findFirstByStorageUnitIdOrderByReadingTimeDesc(storageUnitId);

        SensorReading reading = new SensorReading();
        reading.setStorageUnit(unit);
        reading.setReadingTime(request.getReadingTime() != null ? request.getReadingTime() : LocalDateTime.now());
        reading.setTemperature(request.getTemperature());
        reading.setHumidity(request.getHumidity());
        reading.setPh(request.getPh());
        reading.setGasLevel(request.getGasLevel());
        reading.setMouldRiskIndicator(request.getMouldRiskIndicator());

        SensorSource source = request.getSource();
        if (source == null) {
            source = (request.getDeviceId() != null && !request.getDeviceId().isBlank()) ? SensorSource.IOT : SensorSource.MANUAL;
        }
        reading.setSource(source);

        String deviceId = request.getDeviceId();
        if (deviceId == null || deviceId.isBlank()) {
            deviceId = unit.getDeviceId();
        } else if (unit.getDeviceId() == null || unit.getDeviceId().isBlank()) {
            unit.setDeviceId(deviceId);
            storageUnitRepository.save(unit);
        }
        reading.setDeviceId(deviceId);

        SensorReading saved = sensorReadingRepository.save(reading);

        // Evaluate telemetry against monitoring rules & generate alerts
        storageMonitoringService.evaluateReading(unit, saved, previousReading.orElse(null));

        return SensorReadingResponse.fromEntity(saved);
    }

    /**
     * Get historical sensor readings for a storage unit, chronological descending.
     */
    @Transactional(readOnly = true)
    public List<SensorReadingResponse> getSensorReadings(Long storageUnitId) {
        findAndValidateStorageUnit(storageUnitId);
        List<SensorReading> readings = sensorReadingRepository.findByStorageUnitIdOrderByReadingTimeDesc(storageUnitId);
        return readings.stream()
                .map(SensorReadingResponse::fromEntity)
                .toList();
    }

    /**
     * Get latest sensor reading for a storage unit.
     */
    @Transactional(readOnly = true)
    public SensorReadingResponse getLatestSensorReading(Long storageUnitId) {
        findAndValidateStorageUnit(storageUnitId);
        SensorReading reading = sensorReadingRepository.findFirstByStorageUnitIdOrderByReadingTimeDesc(storageUnitId)
                .orElseThrow(() -> new ResourceNotFoundException("No sensor readings found for storage unit " + storageUnitId));
        return SensorReadingResponse.fromEntity(reading);
    }

    /**
     * Get dashboard summary of all storage units for authenticated farmer.
     */
    @Transactional(readOnly = true)
    public StorageMonitoringSummaryDto getStorageMonitoringSummary() {
        User currentUser = securityUtils.getCurrentUser();
        List<StorageUnit> units;
        if (securityUtils.isAdmin(currentUser)) {
            units = storageUnitRepository.findAll();
        } else {
            units = storageUnitRepository.findByFarmOwnerId(currentUser.getId());
        }

        long total = units.size();
        long monitoringCount = 0;
        long normalCount = 0;
        long attentionCount = 0;
        long offlineCount = 0;
        long totalUnreadAlerts = 0;

        for (StorageUnit u : units) {
            StorageUnitResponse resp = enrichResponse(u);
            totalUnreadAlerts += resp.getUnreadAlertCount();
            switch (resp.getMonitoringStatus()) {
                case ATTENTION_REQUIRED -> attentionCount++;
                case NO_RECENT_DATA, OFFLINE -> offlineCount++;
                case NORMAL -> normalCount++;
                case MONITORING -> monitoringCount++;
            }
        }

        return StorageMonitoringSummaryDto.builder()
                .totalStorageUnits(total)
                .monitoringUnits(monitoringCount)
                .normalUnits(normalCount)
                .attentionRequiredUnits(attentionCount)
                .offlineUnits(offlineCount)
                .unreadAlertCount(totalUnreadAlerts)
                .build();
    }

    /**
     * Helper to find StorageUnit and validate that current user is owner or admin.
     */
    private StorageUnit findAndValidateStorageUnit(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        StorageUnit unit = storageUnitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Storage unit not found with id: " + id));

        validateFarmOwnership(unit.getFarm(), currentUser);
        return unit;
    }

    private void validateFarmOwnership(Farm farm, User user) {
        if (!securityUtils.isAdmin(user) && !farm.getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not have permission to access resources on this farm");
        }
    }

    private StorageUnitResponse enrichResponse(StorageUnit unit) {
        StorageUnitResponse resp = StorageUnitResponse.fromEntity(unit);

        Optional<SensorReading> latestOpt = sensorReadingRepository.findFirstByStorageUnitIdOrderByReadingTimeDesc(unit.getId());
        long unreadAlerts = 0;
        if (unit.getFarm() != null && unit.getFarm().getOwner() != null) {
            unreadAlerts = alertRepository.findByUserIdAndIsReadFalse(unit.getFarm().getOwner().getId())
                    .stream()
                    .filter(a -> "STORAGE_UNIT".equals(a.getRelatedEntityType()) && unit.getId().equals(a.getRelatedEntityId()))
                    .count();
        }
        resp.setUnreadAlertCount(unreadAlerts);

        if (latestOpt.isPresent()) {
            SensorReading latest = latestOpt.get();
            resp.setLatestTemperature(latest.getTemperature());
            resp.setLatestPh(latest.getPh());
            resp.setLatestHumidity(latest.getHumidity());
            resp.setLastReadingTime(latest.getReadingTime());
            MonitoringStatus status = storageMonitoringService.determineStatus(unit, latest, unreadAlerts);
            resp.setMonitoringStatus(status);
        } else {
            resp.setMonitoringStatus(MonitoringStatus.MONITORING);
        }

        return resp;
    }
}
