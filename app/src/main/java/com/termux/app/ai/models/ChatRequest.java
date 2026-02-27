package com.termux.app.ai.models;

import com.google.gson.annotations.SerializedName;

/**
 * Chat Request model
 */
public class ChatRequest {
    @SerializedName("message")
    private String message;
    
    @SerializedName("sessionId")
    private String sessionId;

    public ChatRequest(String message, String sessionId) {
        this.message = message;
        this.sessionId = sessionId;
    }
}
