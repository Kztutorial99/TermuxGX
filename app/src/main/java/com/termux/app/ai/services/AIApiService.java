package com.termux.app.ai.services;

import com.termux.app.ai.models.ChatRequest;
import com.termux.app.ai.models.ChatResponse;
import com.termux.app.ai.models.CommandRequest;
import com.termux.app.ai.models.CommandResponse;
import com.termux.app.ai.models.LoginRequest;
import com.termux.app.ai.models.LoginResponse;
import com.termux.app.ai.models.ProfileResponse;
import com.termux.app.ai.models.SignupRequest;
import com.termux.app.ai.models.SignupResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;

/**
 * AI API Service Interface
 */
public interface AIApiService {
    
    @POST("auth/signup")
    Call<SignupResponse> signup(@Body SignupRequest request);
    
    @POST("auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);
    
    @POST("auth/logout")
    Call<Void> logout();
    
    @POST("chat")
    Call<ChatResponse> chat(@Header("Authorization") String token,
                            @Body ChatRequest request);
    
    @POST("termux/execute")
    Call<CommandResponse> executeCommand(@Header("Authorization") String token,
                                         @Body CommandRequest request);
    
    @GET("profile")
    Call<ProfileResponse> getProfile(@Header("Authorization") String token);
    
    static AIApiService createService(String baseUrl) {
        return ServiceGenerator.createService(AIApiService.class, baseUrl);
    }
}
