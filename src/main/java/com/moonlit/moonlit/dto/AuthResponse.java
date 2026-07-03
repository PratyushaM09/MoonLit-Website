/* package com.moonlit.moonlit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String email;
    private String username;
    private String firstName;
    private String lastName;
    private String message;
}*/

package com.moonlit.moonlit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String email;
    private String username;
    private String firstName;
    private String lastName;
    private String message;
    private String token;
}