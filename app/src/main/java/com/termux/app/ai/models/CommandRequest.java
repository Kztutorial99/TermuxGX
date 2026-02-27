package com.termux.app.ai.models;

import com.google.gson.annotations.SerializedName;

/**
 * Termux Command Request model
 */
public class CommandRequest {
    @SerializedName("command")
    private String command;
    
    @SerializedName("sessionId")
    private String sessionId;

    public CommandRequest(String command, String sessionId) {
        this.command = command;
        this.sessionId = sessionId;
    }
}
