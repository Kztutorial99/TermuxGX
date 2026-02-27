package com.termux.app.ai.models;

import com.google.gson.annotations.SerializedName;

/**
 * Chat Response model
 */
public class ChatResponse {
    @SerializedName("message")
    private String message;
    
    @SerializedName("sessionId")
    private String sessionId;
    
    @SerializedName("model")
    private String model;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
}
