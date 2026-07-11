package com.educollab.auth.service;

import com.educollab.auth.dto.response.UserResponse;
import com.educollab.auth.entity.User;
import com.educollab.auth.exception.ResourceNotFoundException;
import com.educollab.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserQueryService {

    private final UserRepository userRepository;

    public UserResponse getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return UserResponse.from(user);
    }

    public UserResponse getByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return UserResponse.from(user);
    }

 
    public List<UserResponse> getByIds(List<Long> ids) {
        return userRepository.findAllById(ids).stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    public List<UserResponse> search(String query) {
        return userRepository.searchUsers(query).stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }
}
