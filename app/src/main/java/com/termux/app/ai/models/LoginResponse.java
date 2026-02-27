package com.termux.app.ai.models;

import com.google.gson.annotations.SerializedName;

/**
 * Login Response model
 */
public class LoginResponse {
    @SerializedName("message")
    private String message;
    
    @SerializedName("user")
    private User user;
    
    @SerializedName("token")
    private String token;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
