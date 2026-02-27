package com.termux.app.ai.models;

import com.google.gson.annotations.SerializedName;

/**
 * Login Request model
 */
public class LoginRequest {
    @SerializedName("email")
    private String email;
    
    @SerializedName("username")
    private String username;
    
    @SerializedName("password")
    private String password;

    public LoginRequest(String email, String username, String password) {
        this.email = email;
        this.username = username;
        this.password = password;
    }
}
