package com.termux.app.ai.models;

import com.google.gson.annotations.SerializedName;

/**
 * Termux Command Response model
 */
public class CommandResponse {
    @SerializedName("command")
    private String command;
    
    @SerializedName("output")
    private String output;
    
    @SerializedName("error")
    private String error;
    
    @SerializedName("exitCode")
    private Integer exitCode;
    
    @SerializedName("executionTime")
    private Long executionTime;

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = command; }
    public String getOutput() { return output; }
    public void setOutput(String output) { this.output = output; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    public Integer getExitCode() { return exitCode; }
    public void setExitCode(Integer exitCode) { this.exitCode = exitCode; }
    public Long getExecutionTime() { return executionTime; }
    public void setExecutionTime(Long executionTime) { this.executionTime = executionTime; }
}
