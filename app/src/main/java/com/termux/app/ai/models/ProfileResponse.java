package com.termux.app.ai.models;

import com.google.gson.annotations.SerializedName;

/**
 * Profile Response model
 */
public class ProfileResponse {
    @SerializedName("user")
    private User user;
    
    @SerializedName("api_key")
    private Object apiKey;
    
    @SerializedName("stats")
    private UserStats stats;

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Object getApiKey() { return apiKey; }
    public void setApiKey(Object apiKey) { this.apiKey = apiKey; }
    public UserStats getStats() { return stats; }
    public void setStats(UserStats stats) { this.stats = stats; }
}
