package com.educollab.service;

import com.educollab.dto.request.LoginRequest;
import com.educollab.dto.request.RegisterRequest;
import com.educollab.dto.response.AuthResponse;
import com.educollab.entity.RefreshToken;
import com.educollab.entity.User;
import com.educollab.exception.DuplicateResourceException;
import com.educollab.repository.UserRepository;
import com.educollab.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check for duplicates
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already in use: " + request.getEmail());
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username already taken: " + request.getUsername());
        }

        // Build and save user
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .enabled(true)   // In production: set false, send email verification
                .accountNonLocked(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("New user registered: {} ({})", savedUser.getEmail(), savedUser.getRole());

        // Generate tokens
        return buildAuthResponse(savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenService.verifyExpiration(refreshTokenValue);
        User user = refreshToken.getUser();

        String newAccessToken = jwtUtils.generateToken(
                org.springframework.security.core.userdetails.User.builder()
                        .username(user.getEmail())
                        .password(user.getPassword())
                        .authorities(user.getRole().name())
                        .build()
        );

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshTokenValue)
                .user(mapToUserInfo(user))
                .build();
    }

    @Transactional
    public void logout(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        refreshTokenService.revokeTokensByUser(user);
        log.info("User logged out: {}", userEmail);
    }

    private AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(user.getRole().name())
                .build();

        String accessToken = jwtUtils.generateToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .user(mapToUserInfo(user))
                .build();
    }

    private AuthResponse.UserInfo mapToUserInfo(User user) {
        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
