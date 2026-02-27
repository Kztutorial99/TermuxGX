package com.termux.app.ai.models;

import com.google.gson.annotations.SerializedName;

/**
 * User Stats model
 */
public class UserStats {
    @SerializedName("total_sessions")
    private int totalSessions;
    
    @SerializedName("total_messages")
    private int totalMessages;
    
    @SerializedName("total_commands")
    private int totalCommands;

    public int getTotalSessions() { return totalSessions; }
    public void setTotalSessions(int totalSessions) { this.totalSessions = totalSessions; }
    public int getTotalMessages() { return totalMessages; }
    public void setTotalMessages(int totalMessages) { this.totalMessages = totalMessages; }
    public int getTotalCommands() { return totalCommands; }
    public void setTotalCommands(int totalCommands) { this.totalCommands = totalCommands; }
}
