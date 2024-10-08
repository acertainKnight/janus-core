import React, { useState, useEffect, useRef } from 'react'
import { Textarea } from "../components/ui/textarea/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select/select"
import { Button } from "../components/ui/button/button"
import { Message } from '../types'
import { RefreshCw, Edit, Check, Trash } from 'lucide-react'
import { Input } from "../components/ui/input/input"

interface ConversationPanelProps {
  model: string
  setModel: (model: string) => void
  systemPrompt: string
  setSystemPrompt: (prompt: string) => void
  userPrompt: string
  setUserPrompt: (prompt: string) => void
  conversation: Message[]
  handleGenerate: () => void
  isGenerating: boolean
  onEditMessage: (editedMessage: Message) => void
  onRegenerateFromMessage: (message: Message) => void
  onDeleteMessage: (index: number) => void
  conversationTitle: string;
  setConversationTitle: (title: string) => void;
  onSaveConversation: (title: string) => void; // Add this new prop
}

const ConversationPanel: React.FC<ConversationPanelProps> = ({
  model,
  setModel,
  systemPrompt,
  setSystemPrompt,
  userPrompt,
  setUserPrompt,
  conversation,
  handleGenerate,
  isGenerating,
  onEditMessage,
  onRegenerateFromMessage,
  onDeleteMessage,
  conversationTitle,
  setConversationTitle,
  onSaveConversation // Add this new prop
}) => {
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  };

  const handleEdit = (index: number) => {
    setEditingMessageIndex(index);
    setEditedContent(conversation[index].content);
  };

  const handleSave = (index: number) => {
    onEditMessage({ ...conversation[index], content: editedContent });
    setEditingMessageIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <Input
          value={conversationTitle}
          onChange={(e) => setConversationTitle(e.target.value)}
          placeholder="Conversation Title"
          className="bg-gray-900 text-gray-100 border-gray-700 placeholder-gray-500"
        />
      </div>
      <div className="flex space-x-2">
        <Select value={model} onValueChange={setModel} className="w-1/2">
          <SelectTrigger className="bg-gray-900 text-gray-100 border-gray-700">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 text-gray-100 border-gray-700">
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo Preview</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
            <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
            <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
            <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
            <SelectItem value="claude-2.1">Claude 2.1</SelectItem>
          </SelectContent>
        </Select>
        <Textarea
          placeholder="System prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-1/2 bg-gray-900 text-gray-100 border-gray-700 placeholder-gray-500"
        />
      </div>
      <div 
        ref={chatWindowRef}
        className="border border-gray-800 p-4 h-[400px] overflow-y-auto bg-gray-900 rounded-lg"
      >
        {conversation.map((message, index) => (
          <div key={index} className={`p-4 rounded-lg mb-4 ${message.role === 'user' ? 'bg-blue-600' : 'bg-green-600'}`}>
            {editingMessageIndex === index ? (
              <div>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="mb-2 bg-gray-800 text-gray-100 border-gray-700"
                />
                <Button onClick={() => handleSave(index)} className="mr-2">
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-gray-100 mb-2">{message.content}</p>
                {message.model && (
                  <p className="text-xs text-gray-300 mb-2">Model: {message.model}</p>
                )}
                <div className="flex space-x-2">
                  <Button onClick={() => handleEdit(index)} variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  {message.role === 'assistant' && (
                    <Button onClick={() => onRegenerateFromMessage(conversation[index - 1])} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  )}
                  <Button onClick={() => onDeleteMessage(index)} variant="outline" size="sm">
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <Textarea
          placeholder="User prompt"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          className="flex-grow bg-gray-900 text-gray-100 border-gray-700 placeholder-gray-500"
        />
        <Button 
          onClick={handleGenerate} 
          className="bg-blue-600 hover:bg-blue-700 text-gray-100"
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </div>
    </div>
  )
}

export default ConversationPanel