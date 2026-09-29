package com.cattlefeedai.api.security;

import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Custom UserDetailsService that loads user data from the database.
 * Uses email as the principal identifier (Spring Security's "username").
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Load user by email address.
     * Spring Security calls this during authentication.
     *
     * @param email the user's email (used as the username in this application)
     * @return UserDetails backed by the database User entity
     * @throws UsernameNotFoundException if no user exists with the given email
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + email));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                user.getIsActive(),       // enabled
                true,                      // accountNonExpired
                true,                      // credentialsNonExpired
                true,                      // accountNonLocked
                Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
                )
        );
    }
}
