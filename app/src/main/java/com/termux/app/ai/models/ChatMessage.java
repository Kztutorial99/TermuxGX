package com.termux.app.ai.models;

/**
 * Chat Message model
 */
public class ChatMessage {
    private String role;
    private String content;
    private String time;
    private String termuxCommand;
    private String termuxOutput;
    private Integer exitCode;

    public ChatMessage() {}

    public ChatMessage(String role, String content, String time) {
        this.role = role;
        this.content = content;
        this.time = time;
    }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getTermuxCommand() { return termuxCommand; }
    public void setTermuxCommand(String termuxCommand) { this.termuxCommand = termuxCommand; }
    public String getTermuxOutput() { return termuxOutput; }
    public void setTermuxOutput(String termuxOutput) { this.termuxOutput = termuxOutput; }
    public Integer getExitCode() { return exitCode; }
    public void setExitCode(Integer exitCode) { this.exitCode = exitCode; }
}
