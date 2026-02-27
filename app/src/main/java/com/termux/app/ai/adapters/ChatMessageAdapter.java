package com.termux.app.ai.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;

import com.termux.app.R;
import com.termux.app.ai.models.ChatMessage;

import java.util.List;

/**
 * Chat Message Adapter
 */
public class ChatMessageAdapter extends RecyclerView.Adapter<ChatMessageAdapter.ViewHolder> {

    private static final int VIEW_TYPE_USER = 1;
    private static final int VIEW_TYPE_AI = 2;
    private static final int VIEW_TYPE_SYSTEM = 3;

    private Context context;
    private List<ChatMessage> messages;

    public ChatMessageAdapter(Context context, List<ChatMessage> messages) {
        this.context = context;
        this.messages = messages;
    }

    @Override
    public int getItemViewType(int position) {
        ChatMessage message = messages.get(position);
        if ("user".equals(message.getRole())) {
            return VIEW_TYPE_USER;
        } else if ("assistant".equals(message.getRole())) {
            if (message.getTermuxCommand() != null) {
                return VIEW_TYPE_AI; // AI with command
            }
            return VIEW_TYPE_AI;
        }
        return VIEW_TYPE_SYSTEM;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_chat_message, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ChatMessage message = messages.get(position);

        if (getItemViewType(position) == VIEW_TYPE_USER) {
            holder.userContainer.setVisibility(View.VISIBLE);
            holder.aiContainer.setVisibility(View.GONE);
            holder.systemMessage.setVisibility(View.GONE);
            holder.tvUserMessage.setText(message.getContent());
            holder.tvUserTime.setText(message.getTime());
        } else if (getItemViewType(position) == VIEW_TYPE_AI) {
            holder.userContainer.setVisibility(View.GONE);
            holder.aiContainer.setVisibility(View.VISIBLE);
            holder.systemMessage.setVisibility(View.GONE);
            holder.tvAiMessage.setText(message.getContent());
            holder.tvAiTime.setText(message.getTime());

            if (message.getTermuxCommand() != null) {
                holder.termuxContainer.setVisibility(View.VISIBLE);
                holder.tvTermuxCommand.setText(message.getTermuxCommand());
                holder.tvTermuxOutput.setText(message.getTermuxOutput() != null ? message.getTermuxOutput() : "(no output)");
            } else {
                holder.termuxContainer.setVisibility(View.GONE);
            }
        } else if (getItemViewType(position) == VIEW_TYPE_SYSTEM) {
            holder.userContainer.setVisibility(View.GONE);
            holder.aiContainer.setVisibility(View.GONE);
            holder.systemMessage.setVisibility(View.VISIBLE);
            holder.systemMessage.setText(message.getContent());
        }
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    public void addMessage(ChatMessage message) {
        messages.add(message);
        notifyItemInserted(messages.size() - 1);
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        LinearLayout userContainer, aiContainer;
        TextView systemMessage;
        CardView userMessageCard, aiMessageCard;
        TextView tvUserMessage, tvUserTime, tvAiMessage, tvAiTime;
        ImageView ivAiAvatar;
        LinearLayout termuxContainer;
        TextView tvTermuxCommand, tvTermuxOutput, tvTermuxOutputLabel;

        ViewHolder(View itemView) {
            super(itemView);
            userContainer = itemView.findViewById(R.id.user_message_container);
            aiContainer = itemView.findViewById(R.id.ai_message_container);
            systemMessage = itemView.findViewById(R.id.tv_system_message);
            userMessageCard = itemView.findViewById(R.id.user_message_card);
            aiMessageCard = itemView.findViewById(R.id.ai_message_card);
            tvUserMessage = itemView.findViewById(R.id.tv_user_message);
            tvUserTime = itemView.findViewById(R.id.tv_user_time);
            tvAiMessage = itemView.findViewById(R.id.tv_ai_message);
            tvAiTime = itemView.findViewById(R.id.tv_ai_time);
            ivAiAvatar = itemView.findViewById(R.id.iv_ai_avatar);
            termuxContainer = itemView.findViewById(R.id.termux_command_container);
            tvTermuxCommand = itemView.findViewById(R.id.tv_termux_command);
            tvTermuxOutput = itemView.findViewById(R.id.tv_termux_output);
            tvTermuxOutputLabel = itemView.findViewById(R.id.tv_termux_output_label);
        }
    }
}
