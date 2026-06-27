package com.learningtracker.service;

import com.learningtracker.constant.AppConstants;
import com.learningtracker.constant.enums.OtpPurpose;
import com.learningtracker.constant.enums.Theme;
import com.learningtracker.dto.request.*;
import com.learningtracker.dto.response.AuthResponse;
import com.learningtracker.dto.response.MessageResponse;
import com.learningtracker.entity.OtpToken;
import com.learningtracker.entity.User;
import com.learningtracker.entity.UserSettings;
import com.learningtracker.exception.DuplicateResourceException;
import com.learningtracker.exception.InvalidOperationException;
import com.learningtracker.exception.ResourceNotFoundException;
import com.learningtracker.repository.OtpTokenRepository;
import com.learningtracker.repository.UserRepository;
import com.learningtracker.repository.UserSettingsRepository;
import com.learningtracker.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;
    private final UserService userService;

    private static final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new InvalidOperationException("Passwords do not match");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole("USER");
        user.setEmailVerified(true);

        User savedUser = userRepository.save(user);

        // Create default settings
        UserSettings settings = new UserSettings();
        settings.setUser(savedUser);
        settings.setTimezone("UTC");
        settings.setReminderTime(LocalTime.of(9, 0));
        settings.setTheme(Theme.SYSTEM);
        settings.setEmailNotifications(true);
        settings.setDailyReminder(true);
        settings.setWeeklySummary(true);
        settings.setAchievementAlerts(true);
        userSettingsRepository.save(settings);

        // Map to userDetails to generate initial tokens
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationFromToken(accessToken))
                .user(userService.mapToUserResponse(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationFromToken(accessToken))
                .user(userService.mapToUserResponse(user))
                .build();
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (jwtTokenProvider.validateToken(token)) {
            String email = jwtTokenProvider.getUsernameFromToken(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

            String accessToken = jwtTokenProvider.generateAccessToken(userDetails);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(token)
                    .tokenType("Bearer")
                    .expiresIn(jwtTokenProvider.getExpirationFromToken(accessToken))
                    .user(userService.mapToUserResponse(user))
                    .build();
        }
        throw new InvalidOperationException("Invalid or expired refresh token");
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        String otp = generateOtpCode();
        OtpToken otpToken = new OtpToken();
        otpToken.setUser(user);
        otpToken.setOtpCode(otp);
        otpToken.setPurpose(OtpPurpose.PASSWORD_RESET);
        otpToken.setExpiresAt(LocalDateTime.now().plusMinutes(AppConstants.OTP_EXPIRY_MINUTES));
        otpToken.setUsed(false);
        otpToken.setCreatedAt(LocalDateTime.now());
        otpToken.setUpdatedAt(LocalDateTime.now());
        otpTokenRepository.save(otpToken);

        emailService.sendOtpEmail(user, otp);
    }

    @Transactional
    public MessageResponse verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        java.util.List<OtpToken> tokens = otpTokenRepository
                .findByUserAndPurposeAndUsedFalseOrderByCreatedAtDesc(user, OtpPurpose.EMAIL_VERIFICATION);

        if (tokens.isEmpty()) {
            // Also check for password reset purpose
            tokens = otpTokenRepository
                    .findByUserAndPurposeAndUsedFalseOrderByCreatedAtDesc(user, OtpPurpose.PASSWORD_RESET);
        }

        if (tokens.isEmpty()) {
            throw new InvalidOperationException("No active OTP code found");
        }

        OtpToken otpToken = tokens.get(0);
        if (otpToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidOperationException("OTP code has expired");
        }

        if (!otpToken.getOtpCode().equals(request.getOtp())) {
            throw new InvalidOperationException("Invalid OTP code");
        }

        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        if (otpToken.getPurpose() == OtpPurpose.EMAIL_VERIFICATION) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        return new MessageResponse("OTP verified successfully", true);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidOperationException("Passwords do not match");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        java.util.List<OtpToken> tokens = otpTokenRepository
                .findByUserAndPurposeAndUsedFalseOrderByCreatedAtDesc(user, OtpPurpose.PASSWORD_RESET);

        if (tokens.isEmpty()) {
            throw new InvalidOperationException("No password reset request found");
        }

        OtpToken otpToken = tokens.get(0);
        if (otpToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidOperationException("OTP has expired");
        }

        if (!otpToken.getOtpCode().equals(request.getOtp())) {
            throw new InvalidOperationException("Invalid OTP");
        }

        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private String generateOtpCode() {
        int code = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(code);
    }
}
