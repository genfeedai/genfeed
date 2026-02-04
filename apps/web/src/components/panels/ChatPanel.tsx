'use client';

import { MessageSquare, Send, X } from 'lucide-react';
import { memo, useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '@/store/workflowStore';

function ChatPanelComponent() {
  const isChatOpen = useWorkflowStore((state) => state.isChatOpen);
  const chatMessages = useWorkflowStore((state) => state.chatMessages);
  const addChatMessage = useWorkflowStore((state) => state.addChatMessage);
  const setChatOpen = useWorkflowStore((state) => state.setChatOpen);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    addChatMessage('user', trimmed);
    setInputValue('');

    // Focus input after sending
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [inputValue, addChatMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!isChatOpen) return null;

  return (
    <div className="absolute right-4 top-4 bottom-4 w-[360px] bg-background border border-border rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Workflow Assistant</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setChatOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-8">
            Ask me to create or modify your workflow.
            <br />
            Try: &quot;Add an image generation node connected to a prompt&quot;
          </div>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to do..."
            className="flex-1 min-h-[36px] max-h-[120px] px-3 py-2 text-sm bg-background border border-border rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            rows={1}
          />
          <Button size="icon-sm" onClick={handleSend} disabled={!inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export const ChatPanel = memo(ChatPanelComponent);
