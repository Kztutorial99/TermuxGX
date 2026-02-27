package com.termux.app.ai;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.text.TextUtils;
import android.util.Patterns;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.termux.app.R;
import com.termux.app.ai.adapters.ChatMessageAdapter;
import com.termux.app.ai.models.ChatMessage;
import com.termux.app.ai.models.LoginRequest;
import com.termux.app.ai.models.LoginResponse;
import com.termux.app.ai.models.SignupRequest;
import com.termux.app.ai.models.SignupResponse;
import com.termux.app.ai.services.AIApiService;
import com.termux.shared.activities.TermuxActivityBase;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * AI Sidebar Activity - Llama 3.3 70B powered assistant
 * Integrated into Termux sidebar for easy access
 */
public class AISidebarActivity extends TermuxActivityBase {

    private static final String PREFS_NAME = "ai_sidebar_prefs";
    private static final String PREF_TOKEN = "auth_token";
    private static final String PREF_USER_ID = "user_id";
    private static final String PREF_USERNAME = "username";
    private static final String PREF_SESSION_ID = "session_id";
    private static final String PREF_API_BASE_URL = "api_base_url";

    // UI Components - Login/Signup
    private ScrollView loginForm;
    private LinearLayout chatInterface;
    private ProgressBar progressBar;
    private TextInputEditText etLoginCredential, etLoginPassword;
    private TextInputEditText etSignupEmail, etSignupUsername, etSignupPassword, etSignupConfirmPassword;
    private MaterialButton btnLogin, btnSignup;
    private ImageButton btnProfile, btnLogout;
    private TextView tvApiKeyDisplay;

    // UI Components - Chat
    private RecyclerView rvMessages;
    private EditText etMessage;
    private ImageButton btnSend, btnTermuxCommand;

    // Adapter and data
    private ChatMessageAdapter chatAdapter;
    private List<ChatMessage> messages;
    private String currentSessionId;

    // API Service
    private AIApiService apiService;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_ai_sidebar);

        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        // Initialize API service
        String baseUrl = prefs.getString(PREF_API_BASE_URL, "https://your-vercel-url.vercel.app/api");
        apiService = AIApiService.createService(baseUrl);

        setupToolbar();
        setupViews();
        setupClickListeners();

        // Check if already logged in
        if (isLoggedIn()) {
            showChatInterface();
        } else {
            showLoginForm();
        }
    }

    private void setupToolbar() {
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(R.string.ai_sidebar_title);
        }
        toolbar.setNavigationOnClickListener(v -> onBackPressed());
    }

    private void setupViews() {
        // Forms
        loginForm = findViewById(R.id.login_form);
        chatInterface = findViewById(R.id.chat_interface);
        progressBar = findViewById(R.id.progress_bar);

        // Login fields
        etLoginCredential = findViewById(R.id.et_login_credential);
        etLoginPassword = findViewById(R.id.et_login_password);
        btnLogin = findViewById(R.id.btn_login);

        // Signup fields
        etSignupEmail = findViewById(R.id.et_signup_email);
        etSignupUsername = findViewById(R.id.et_signup_username);
        etSignupPassword = findViewById(R.id.et_signup_password);
        etSignupConfirmPassword = findViewById(R.id.et_signup_confirm_password);
        btnSignup = findViewById(R.id.btn_signup);

        // Profile buttons
        btnProfile = findViewById(R.id.btn_profile);
        btnLogout = findViewById(R.id.btn_logout);
        tvApiKeyDisplay = findViewById(R.id.tv_api_key_display);

        // Chat fields
        rvMessages = findViewById(R.id.rv_messages);
        etMessage = findViewById(R.id.et_message);
        btnSend = findViewById(R.id.btn_send);
        btnTermuxCommand = findViewById(R.id.btn_termux_command);

        // Setup RecyclerView
        messages = new ArrayList<>();
        chatAdapter = new ChatMessageAdapter(this, messages);
        rvMessages.setLayoutManager(new LinearLayoutManager(this));
        rvMessages.setAdapter(chatAdapter);
    }

    private void setupClickListeners() {
        // Login button
        btnLogin.setOnClickListener(v -> attemptLogin());

        // Signup button
        btnSignup.setOnClickListener(v -> attemptSignup());

        // Send message
        btnSend.setOnClickListener(v -> sendMessage());
        etMessage.setOnEditorActionListener((v, actionId, event) -> {
            sendMessage();
            return true;
        });

        // Termux command button
        btnTermuxCommand.setOnClickListener(v -> showTermuxCommandDialog());

        // Logout button
        btnLogout.setOnClickListener(v -> attemptLogout());

        // Profile button
        btnProfile.setOnClickListener(v -> showProfileDialog());
    }

    private void attemptLogin() {
        String credential = getText(etLoginCredential);
        String password = getText(etLoginPassword);

        if (TextUtils.isEmpty(credential) || TextUtils.isEmpty(password)) {
            Toast.makeText(this, R.string.ai_error_login, Toast.LENGTH_SHORT).show();
            return;
        }

        showLoading(true);

        boolean isEmail = Patterns.EMAIL_ADDRESS.matcher(credential).matches();
        LoginRequest request = new LoginRequest(
            isEmail ? credential : null,
            isEmail ? null : credential,
            password
        );

        apiService.login(request).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(@NonNull Call<LoginResponse> call, @NonNull Response<LoginResponse> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    LoginResponse data = response.body();
                    saveAuthData(data);
                    Toast.makeText(AISidebarActivity.this, R.string.ai_login_success, Toast.LENGTH_SHORT).show();
                    showChatInterface();
                } else {
                    String error = response.errorBody() != null ? response.errorBody().toString() : "Login failed";
                    Toast.makeText(AISidebarActivity.this, getString(R.string.ai_error_login, error), Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<LoginResponse> call, @NonNull Throwable t) {
                showLoading(false);
                Toast.makeText(AISidebarActivity.this, getString(R.string.ai_error_login, t.getMessage()), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void attemptSignup() {
        String email = getText(etSignupEmail);
        String username = getText(etSignupUsername);
        String password = getText(etSignupPassword);
        String confirmPassword = getText(etSignupConfirmPassword);

        // Validation
        if (TextUtils.isEmpty(email) || TextUtils.isEmpty(username) || TextUtils.isEmpty(password)) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            etSignupEmail.setError(getString(R.string.ai_invalid_email));
            return;
        }

        if (username.length() < 3) {
            etSignupUsername.setError(getString(R.string.ai_username_short));
            return;
        }

        if (password.length() < 6) {
            etSignupPassword.setError(getString(R.string.ai_weak_password));
            return;
        }

        if (!password.equals(confirmPassword)) {
            etSignupConfirmPassword.setError(getString(R.string.ai_passwords_mismatch));
            return;
        }

        showLoading(true);

        SignupRequest request = new SignupRequest(email, username, password, null);

        apiService.signup(request).enqueue(new Callback<SignupResponse>() {
            @Override
            public void onResponse(@NonNull Call<SignupResponse> call, @NonNull Response<SignupResponse> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    SignupResponse data = response.body();
                    saveAuthData(data);
                    Toast.makeText(AISidebarActivity.this, R.string.ai_signup_success, Toast.LENGTH_SHORT).show();
                    
                    // Show API key
                    tvApiKeyDisplay.setVisibility(View.VISIBLE);
                    tvApiKeyDisplay.setText("API Key: " + data.getApi_key().substring(0, 20) + "...");
                    
                    showChatInterface();
                } else {
                    String error = response.errorBody() != null ? response.errorBody().toString() : "Signup failed";
                    Toast.makeText(AISidebarActivity.this, getString(R.string.ai_error_signup, error), Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<SignupResponse> call, @NonNull Throwable t) {
                showLoading(false);
                Toast.makeText(AISidebarActivity.this, getString(R.string.ai_error_signup, t.getMessage()), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void sendMessage() {
        String message = getText(etMessage);
        if (TextUtils.isEmpty(message)) return;

        // Add user message to UI
        ChatMessage userMessage = new ChatMessage("user", message, getCurrentTime());
        messages.add(userMessage);
        chatAdapter.notifyItemInserted(messages.size() - 1);
        rvMessages.scrollToPosition(messages.size() - 1);
        etMessage.setText("");

        showLoading(true);

        String token = "Bearer " + prefs.getString(PREF_TOKEN, "");
        ChatRequest request = new ChatRequest(message, currentSessionId);
        
        apiService.chat(token, request).enqueue(new Callback<ChatResponse>() {
            @Override
            public void onResponse(@NonNull Call<ChatResponse> call,
                                   @NonNull Response<ChatResponse> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    ChatResponse data = response.body();
                    ChatMessage aiMessage = new ChatMessage("assistant", data.getMessage(), getCurrentTime());
                    messages.add(aiMessage);
                    chatAdapter.notifyItemInserted(messages.size() - 1);
                    rvMessages.scrollToPosition(messages.size() - 1);
                    
                    if (data.getSessionId() != null) {
                        currentSessionId = data.getSessionId();
                        prefs.edit().putString(PREF_SESSION_ID, currentSessionId).apply();
                    }
                } else {
                    Toast.makeText(AISidebarActivity.this, R.string.ai_error_chat, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<ChatResponse> call, @NonNull Throwable t) {
                showLoading(false);
                Toast.makeText(AISidebarActivity.this, getString(R.string.ai_error_chat, t.getMessage()), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void showTermuxCommandDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle(R.string.execute_command);

        EditText input = new EditText(this);
        input.setHint("e.g., pkg update, ls -la, neofetch");
        builder.setView(input);

        builder.setPositiveButton(R.string.execute_command, (dialog, which) -> {
            String command = input.getText().toString().trim();
            if (!TextUtils.isEmpty(command)) {
                executeTermuxCommand(command);
            }
        });

        builder.setNegativeButton(android.R.string.cancel, null);
        builder.show();
    }

    private void executeTermuxCommand(String command) {
        showLoading(true);

        String token = "Bearer " + prefs.getString(PREF_TOKEN, "");
        CommandRequest request = new CommandRequest(command, currentSessionId);
        
        apiService.executeCommand(token, request)
            .enqueue(new Callback<CommandResponse>() {
                @Override
                public void onResponse(@NonNull Call<CommandResponse> call,
                                       @NonNull Response<CommandResponse> response) {
                    showLoading(false);
                    if (response.isSuccessful() && response.body() != null) {
                        CommandResponse data = response.body();
                        
                        // Add command message to chat
                        ChatMessage cmdMessage = new ChatMessage("assistant", 
                            "Executed command: `" + command + "`", getCurrentTime());
                        cmdMessage.setTermuxCommand(command);
                        cmdMessage.setTermuxOutput(data.getOutput());
                        cmdMessage.setExitCode(data.getExitCode());
                        
                        messages.add(cmdMessage);
                        chatAdapter.notifyItemInserted(messages.size() - 1);
                        rvMessages.scrollToPosition(messages.size() - 1);
                    } else {
                        String error = response.errorBody() != null ? 
                            response.errorBody().toString() : "Command failed";
                        Toast.makeText(AISidebarActivity.this, 
                            getString(R.string.ai_error_command, error), Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(@NonNull Call<CommandResponse> call,
                                      @NonNull Throwable t) {
                    showLoading(false);
                    Toast.makeText(AISidebarActivity.this, 
                        getString(R.string.ai_error_command, t.getMessage()), Toast.LENGTH_LONG).show();
                }
            });
    }

    private void showProfileDialog() {
        String token = "Bearer " + prefs.getString(PREF_TOKEN, "");
        
        apiService.getProfile(token).enqueue(new Callback<ProfileResponse>() {
            @Override
            public void onResponse(@NonNull Call<ProfileResponse> call,
                                   @NonNull Response<ProfileResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ProfileResponse data = response.body();
                    
                    String profileInfo = String.format(Locale.getDefault(),
                        "Username: %s\nEmail: %s\nRole: %s\nMember Since: %s\n\nStats:\nSessions: %d\nMessages: %d\nCommands: %d",
                        data.getUser().getUsername(),
                        data.getUser().getEmail(),
                        data.getUser().getRole(),
                        data.getUser().getCreatedAt(),
                        data.getStats().getTotalSessions(),
                        data.getStats().getTotalMessages(),
                        data.getStats().getTotalCommands()
                    );
                    
                    new AlertDialog.Builder(AISidebarActivity.this)
                        .setTitle(R.string.profile)
                        .setMessage(profileInfo)
                        .setPositiveButton(android.R.string.ok, null)
                        .show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<ProfileResponse> call,
                                  @NonNull Throwable t) {
                Toast.makeText(AISidebarActivity.this, "Failed to load profile", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void attemptLogout() {
        new AlertDialog.Builder(this)
            .setTitle(R.string.logout)
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton(android.R.string.yes, (dialog, which) -> {
                prefs.edit().clear().apply();
                Toast.makeText(AISidebarActivity.this, R.string.ai_logout_success, Toast.LENGTH_SHORT).show();
                showLoginForm();
            })
            .setNegativeButton(android.R.string.no, null)
            .show();
    }

    private void showLoginForm() {
        loginForm.setVisibility(View.VISIBLE);
        chatInterface.setVisibility(View.GONE);
        btnProfile.setVisibility(View.GONE);
        btnLogout.setVisibility(View.GONE);
    }

    private void showChatInterface() {
        loginForm.setVisibility(View.GONE);
        chatInterface.setVisibility(View.VISIBLE);
        btnProfile.setVisibility(View.VISIBLE);
        btnLogout.setVisibility(View.VISIBLE);
        
        // Load saved session
        currentSessionId = prefs.getString(PREF_SESSION_ID, null);
    }

    private void showLoading(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        loginForm.setEnabled(!show);
        chatInterface.setEnabled(!show);
    }

    private boolean isLoggedIn() {
        return prefs.contains(PREF_TOKEN) && !TextUtils.isEmpty(prefs.getString(PREF_TOKEN, ""));
    }

    private void saveAuthData(LoginResponse data) {
        prefs.edit()
            .putString(PREF_TOKEN, data.getToken())
            .putString(PREF_USER_ID, data.getUser().getId())
            .putString(PREF_USERNAME, data.getUser().getUsername())
            .apply();
    }

    private void saveAuthData(SignupResponse data) {
        prefs.edit()
            .putString(PREF_TOKEN, data.getToken())
            .putString(PREF_USER_ID, data.getUser().getId())
            .putString(PREF_USERNAME, data.getUser().getUsername())
            .apply();
    }

    private String getText(EditText editText) {
        return editText.getText() != null ? editText.getText().toString().trim() : "";
    }

    private String getCurrentTime() {
        SimpleDateFormat sdf = new SimpleDateFormat("HH:mm", Locale.getDefault());
        return sdf.format(new Date());
    }
}
