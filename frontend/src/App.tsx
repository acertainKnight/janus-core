import { useState, useEffect, useRef } from 'react'
import { Button } from "./components/ui/button/button"
import { Input } from "./components/ui/input/input"
import { Textarea } from "./components/ui/textarea/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select/select"
import { Slider } from "./components/ui/slider/slider"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs/tabs"
import { Lock, Save, Trash, Send, RefreshCw } from 'lucide-react'
import { Switch } from "./components/ui/switch/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog/dialog"
import { Label } from "./components/ui/label/label"
import SavedPrompts from "./components/SavedPrompts"
import ConversationPanel from "./components/ConversationPanel"
import ModelSettings from "./components/ModelSettings"
import ActionToolbar from "./components/ActionToolbar"
import SavedConversations from "./components/SavedConversations"

type Prompt = {
  id: number;
  name: string;
  systemPrompt: string;
  userPrompt: string;
}

type ModelSettings = {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
}

const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production (on Replit), use the current hostname
    return `https://${window.location.hostname}`;
  } else {
    // In development, use localhost with the port from environment variable or default to 5000
    const port = process.env.REACT_APP_BACKEND_PORT || 5000;
    return `http://localhost:${port}`;
  }
};

export default function LLMPayground() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [model, setModel] = useState('gpt-4')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [conversation, setConversation] = useState<Message[]>([])
  const [savedPrompts, setSavedPrompts] = useState<Prompt[]>([])
  const [promptName, setPromptName] = useState('')
  const [devMode, setDevMode] = useState(false)
  const [modelSettings, setModelSettings] = useState<Record<string, ModelSettings>>({
    'gpt-4': { temperature: 0.7, maxTokens: 2048, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
    'gpt-4-turbo-preview': { temperature: 0.7, maxTokens: 4096, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
    'gpt-3.5-turbo': { temperature: 0.7, maxTokens: 2048, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
    'claude-3-opus-20240229': { temperature: 0.7, maxTokens: 4096, topP: 1 },
    'claude-3-sonnet-20240229': { temperature: 0.7, maxTokens: 4096, topP: 1 },
    'claude-3.5-sonnet': { temperature: 0.7, maxTokens: 4096, topP: 1 }, // Added Claude 3.5 Sonnet
    'claude-3-haiku-20240307': { temperature: 0.7, maxTokens: 4096, topP: 1 },
    'claude-2.1': { temperature: 0.7, maxTokens: 4096, topP: 1 },
    'claude-instant-1.2': { temperature: 0.7, maxTokens: 4096, topP: 1 },
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const [isSavePromptDialogOpen, setIsSavePromptDialogOpen] = useState(false)
  const [conversations, setConversations] = useState<{ id: number; messages: Message[] }[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [savedConversations, setSavedConversations] = useState<{ id: number; messages: Message[] }[]>([])
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set())
  const [conversationTitle, setConversationTitle] = useState('')

  useEffect(() => {
    if (devMode) {
      setIsAuthenticated(true)
    }
    fetchSavedPrompts()
  }, [devMode])

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedConversations();
    }
  }, [isAuthenticated]);

  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchSavedPrompts = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/prompts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedPrompts(data.prompts || []);
      } else {
        console.error('Failed to fetch prompts:', response.statusText);
        setSavedPrompts([]);
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
      setSavedPrompts([]);
    }
  };

  const handleLogin = async (e?: React.FormEvent, isDevMode: boolean = false) => {
    if (e) e.preventDefault();
    try {
      const response = await fetch(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: isDevMode ? 'admin' : username, password: isDevMode ? 'pw' : password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
      } else {
        console.error('Login failed:', data.message);
        // You might want to set an error state here to display to the user
      }
    } catch (error) {
      console.error('Login error:', error);
      // You might want to set an error state here to display to the user
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          model,
          systemPrompt,
          userPrompt,
          conversation,
          ...modelSettings[model]
        })
      });
      const data = await response.json();
      if (response.ok) {
        const newUserMessage: Message = { role: 'user', content: userPrompt, model: 'user' };
        const newAssistantMessage: Message = { role: 'assistant', content: data.response, model: model };
        setConversation([...conversation, newUserMessage, newAssistantMessage]);
        setUserPrompt('');
      } else {
        throw new Error(data.error || 'An error occurred during generation');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Generation failed. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!promptName) {
      return;
    }
    try {
      const response = await fetch(`${getApiUrl()}/api/prompts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: promptName, systemPrompt, userPrompt })
      });
      if (response.ok) {
        setPromptName('');
        fetchSavedPrompts();
        setIsSavePromptDialogOpen(false);
      } else {
        const errorData = await response.json();
        console.error(`Failed to save prompt: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save prompt error:', error);
    }
  };

  const handleLoadPrompt = (prompt: Prompt) => {
    setSystemPrompt(prompt.systemPrompt)
    setUserPrompt(prompt.userPrompt)
  }

  const handleDeletePrompt = async (id: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/prompts/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        fetchSavedPrompts();
      } else {
        const errorData = await response.json();
        console.error('Failed to delete prompt:', errorData.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Delete prompt error:', error);
    }
  }

  const updateModelSetting = (setting: keyof ModelSettings, value: number) => {
    setModelSettings(prev => ({
      ...prev,
      [model]: { ...prev[model], [setting]: value }
    }))
  }

  const setModelWithDefaults = (newModel: string) => {
    setModel(newModel)
    if (!modelSettings[newModel]) {
      setModelSettings(prev => ({
        ...prev,
        [newModel]: { temperature: 0.7, maxTokens: 2048, topP: 1, frequencyPenalty: 0, presencePenalty: 0 }
      }))
    }
  }

  const handleRegenerate = async () => {
    if (isGenerating || conversation.length === 0) return;
    setIsGenerating(true);
    try {
      const lastUserMessage = conversation.filter(msg => msg.role === 'user').pop();
      if (!lastUserMessage) throw new Error('No user message found');

      const response = await fetch(`${getApiUrl()}/api/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          model,
          systemPrompt,
          userPrompt: lastUserMessage.content,
          conversation: conversation.slice(0, -1), // Remove the last assistant message
          ...modelSettings[model]
        })
      });
      const data = await response.json();
      if (response.ok) {
        const newAssistantMessage: Message = { role: 'assistant', content: data.response };
        setConversation(prev => [...prev.slice(0, -1), newAssistantMessage]);
      } else {
        throw new Error(data.error || 'An error occurred during regeneration');
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      alert('Regeneration failed. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveConversation = async () => {
    console.log('Conversation to be saved:', conversation);
    try {
      const response = await fetch(`${getApiUrl()}/api/conversations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          messages: conversation,
          title: conversationTitle.trim() || null // Send null if the title is empty
        })
      });
      const data = await response.json();
      if (response.ok) {
        const { id, title } = data;
        const newConversation = { id, title, messages: conversation };
        setSavedConversations(prev => [...prev, newConversation]);
        setCurrentConversationId(id);
        setConversationTitle(title); // Update the title with the one returned from the server
        alert(`Conversation "${title}" saved successfully`);
      } else {
        throw new Error(data.error || 'An error occurred while saving the conversation');
      }
    } catch (error) {
      console.error('Save conversation error:', error);
      alert('Failed to save conversation. Please try again.');
    }
  };

  const handleForkConversation = async () => {
    try {
      let conversationIdToFork = currentConversationId;

      // If there's no current conversation ID, save the conversation first
      if (!conversationIdToFork) {
        await handleSaveConversation();
        return; // The save function will handle updating the state
      }

      // Now fork the conversation
      const forkResponse = await fetch(`${getApiUrl()}/api/conversations/${conversationIdToFork}/fork`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ forkIndex: conversation.length - 1 }) // Fork from the last message
      });

      if (forkResponse.ok) {
        const forkData = await forkResponse.json();
        const newForkedConversation = {
          id: forkData.id,
          title: forkData.title,
          messages: [...conversation] // Create a new array of the current conversation messages
        };
        setSavedConversations(prev => [...prev, newForkedConversation]);
        setCurrentConversationId(forkData.id);
        setConversationTitle(forkData.title);
        alert('Conversation forked successfully.');
      } else {
        const errorData = await forkResponse.json();
        throw new Error(errorData.error || 'Failed to fork conversation');
      }
    } catch (error) {
      console.error('Fork conversation error:', error);
      alert('Failed to fork conversation. Please try again.');
    }
  };

  const handleLoadConversation = (conversationId: number) => {
    const selectedConversation = savedConversations.find(c => c.id === conversationId);
    if (selectedConversation) {
      setConversation(selectedConversation.messages);
      setConversationTitle(selectedConversation.title);
      setCurrentConversationId(conversationId);
    }
  };

  const handleEditMessage = (editedMessage: Message) => {
    setConversation(conversation.map(msg => 
      msg.role === editedMessage.role && msg.content === editedMessage.content ? editedMessage : msg
    ));
  };

  const handleRegenerateFromMessage = async (message: Message) => {
    const messageIndex = conversation.findIndex(msg => msg === message);
    if (messageIndex !== -1) {
      setIsGenerating(true);
      try {
        const newConversation = conversation.slice(0, messageIndex + 1);
        setConversation(newConversation);

        const response = await fetch(`${getApiUrl()}/api/generate`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            model,
            systemPrompt,
            userPrompt: message.content,
            conversation: newConversation,
            ...modelSettings[model]
          })
        });
        const data = await response.json();
        if (response.ok) {
          const newAssistantMessage: Message = { role: 'assistant', content: data.response, model: model };
          setConversation([...newConversation, newAssistantMessage]);
        } else {
          throw new Error(data.error || 'An error occurred during regeneration');
        }
      } catch (error) {
        console.error('Regeneration error:', error);
        alert('Regeneration failed. Check console for details.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete conversation');
      }

      const data = await response.json();
      console.log(data.message); // Should log "Conversation deleted successfully"

      // Update your state to remove the deleted conversation
      setSavedConversations(prevConversations => 
        prevConversations.filter(conv => conv.id !== conversationId)
      );

      // If the deleted conversation was the current one, clear it
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setConversation([]);
        setConversationTitle('');
      }

    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const fetchSavedConversations = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedConversations(data.conversations || []);
      } else {
        console.error('Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const togglePanel = (panelName: string) => {
    setOpenPanels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(panelName)) {
        newSet.delete(panelName)
      } else {
        newSet.add(panelName)
      }
      return newSet
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const handleDeleteMessage = (index: number) => {
    setConversation(prevConversation => prevConversation.filter((_, i) => i !== index));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Card className="w-[350px] bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-center text-gray-100 text-2xl">Janus Core</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleLogin(e);
            }}>
              <Input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-800 text-gray-300 border-gray-700 placeholder-gray-500 mb-4"
              />
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 text-gray-300 border-gray-700 placeholder-gray-500 mb-4"
              />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-gray-100">
                Login
              </Button>
            </form>
            <div className="flex items-center justify-between">
              <Label htmlFor="dev-mode" className="text-sm font-medium text-gray-300">
                Development Mode
              </Label>
              <Switch
                id="dev-mode"
                checked={devMode}
                onCheckedChange={(checked) => {
                  setDevMode(checked);
                  if (checked) {
                    handleLogin(undefined, true);
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-gray-300">
      <div className="container mx-auto p-4 space-y-4">
        <h1 className="text-3xl font-bold text-gray-100">
          <a href="#" onClick={handleLogout} className="hover:text-blue-400 transition-colors">
            Janus Core
          </a>
        </h1>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-3/4 space-y-4">
            <ConversationPanel
              model={model}
              setModel={setModelWithDefaults}
              systemPrompt={systemPrompt}
              setSystemPrompt={setSystemPrompt}
              userPrompt={userPrompt}
              setUserPrompt={setUserPrompt}
              conversation={conversation}
              handleGenerate={handleGenerate}
              isGenerating={isGenerating}
              onEditMessage={handleEditMessage}
              onRegenerateFromMessage={handleRegenerateFromMessage}
              onDeleteMessage={handleDeleteMessage}
              conversationTitle={conversationTitle}
              setConversationTitle={setConversationTitle}
              onForkConversation={handleForkConversation}
            />
            <ActionToolbar
              handleSavePrompt={handleSavePrompt}
              handleSaveConversation={handleSaveConversation}
              handleForkConversation={handleForkConversation}
              handleRegenerate={handleRegenerate}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </div>
      <ModelSettings
        model={model}
        modelSettings={modelSettings}
        updateModelSetting={updateModelSetting}
        isOpen={openPanels.has('modelSettings')}
        setIsOpen={(isOpen) => togglePanel('modelSettings')}
      />
      <SavedPrompts
        savedPrompts={savedPrompts}
        setSystemPrompt={setSystemPrompt}
        setUserPrompt={setUserPrompt}
        fetchSavedPrompts={fetchSavedPrompts}
        handleLoadPrompt={handleLoadPrompt}
        handleDeletePrompt={handleDeletePrompt}
        isOpen={openPanels.has('savedPrompts')}
        setIsOpen={(isOpen) => togglePanel('savedPrompts')}
      />
      <SavedConversations
        conversations={savedConversations}
        onLoadConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={openPanels.has('savedConversations')}
        setIsOpen={(isOpen) => togglePanel('savedConversations')}
      />
    </div>
  )
}