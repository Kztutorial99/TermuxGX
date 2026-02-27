package com.termux.app.ai.models;

import com.google.gson.annotations.SerializedName;

/**
 * Signup Response model
 */
public class SignupResponse {
    @SerializedName("message")
    private String message;
    
    @SerializedName("user")
    private User user;
    
    @SerializedName("api_key")
    private String apiKey;
    
    @SerializedName("token")
    private String token;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getApi_key() { return apiKey; }
    public void setApi_key(String apiKey) { this.apiKey = apiKey; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
