package com.termux.app.ai.models;

import com.google.gson.annotations.SerializedName;

/**
 * Signup Request model
 */
public class SignupRequest {
    @SerializedName("email")
    private String email;
    
    @SerializedName("username")
    private String username;
    
    @SerializedName("password")
    private String password;
    
    @SerializedName("full_name")
    private String fullName;

    public SignupRequest(String email, String username, String password, String fullName) {
        this.email = email;
        this.username = username;
        this.password = password;
        this.fullName = fullName;
    }
}
