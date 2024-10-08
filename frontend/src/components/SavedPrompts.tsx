import React, { useState } from 'react'
import { Button } from "./ui/button/button"
import { Input } from "./ui/input/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog/dialog"
import { Label } from "./ui/label/label"
import { Save, Trash, BookOpen } from 'lucide-react'
import { Prompt } from '../types'

interface SavedPromptsProps {
  savedPrompts: Prompt[]
  setSystemPrompt: (prompt: string) => void
  setUserPrompt: (prompt: string) => void
  fetchSavedPrompts: () => void
  handleLoadPrompt: (prompt: Prompt) => void
  handleDeletePrompt: (id: number) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const SavedPrompts: React.FC<SavedPromptsProps> = (props) => {
  const [promptName, setPromptName] = useState('')
  const [newSystemPrompt, setNewSystemPrompt] = useState('')
  const [newUserPrompt, setNewUserPrompt] = useState('')

  const handleSavePrompt = async () => {
    if (!promptName) {
      alert('Please enter a name for the prompt')
      return
    }
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: promptName, systemPrompt: newSystemPrompt, userPrompt: newUserPrompt })
      });
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setPromptName('');
        setNewSystemPrompt('');
        setNewUserPrompt('');
        props.fetchSavedPrompts();
      } else {
        const errorData = await response.json();
        alert(`Failed to save prompt: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save prompt error:', error);
      alert('Failed to save prompt. Check console for details.');
    }
  }

  return (
    <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] transition-all duration-300 ${props.isOpen ? 'w-64' : 'w-0'}`}>
      <Button
        className="absolute top-12 -left-12 bg-gray-800 hover:bg-gray-700 h-12 w-12 rounded-l-lg rounded-r-none"
        onClick={() => props.setIsOpen(!props.isOpen)}
      >
        <BookOpen className="w-6 h-6" />
      </Button>
      {props.isOpen && (
        <div className="p-4 h-full w-64 bg-gray-800 overflow-y-auto">
          <div className="flex items-center mb-4">
            <BookOpen className="w-6 h-6 mr-2 text-gray-100" />
            <h2 className="text-xl font-bold text-gray-100">Saved Prompts</h2>
          </div>
          <div className="space-y-2">
            {props.savedPrompts.map((prompt) => (
              <div key={prompt.id} className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => props.handleLoadPrompt(prompt)} className="text-gray-300 hover:text-blue-400 hover:bg-gray-700">
                  {prompt.name}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => props.handleDeletePrompt(prompt.id)} className="text-gray-300 hover:text-red-400 hover:bg-gray-700">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-4 bg-green-600 hover:bg-green-700 text-gray-100">
                <Save className="w-4 h-4 mr-2" />Save New Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 text-gray-100 border-gray-800">
              <DialogHeader>
                <DialogTitle>Save New Prompt</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-name" className="text-gray-300">Prompt Name</Label>
                  <Input
                    id="prompt-name"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    placeholder="Enter a name for your prompt"
                    className="bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system-prompt" className="text-gray-300">System Prompt</Label>
                  <Input
                    id="system-prompt"
                    value={newSystemPrompt}
                    onChange={(e) => setNewSystemPrompt(e.target.value)}
                    placeholder="Enter system prompt"
                    className="bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-prompt" className="text-gray-300">User Prompt</Label>
                  <Input
                    id="user-prompt"
                    value={newUserPrompt}
                    onChange={(e) => setNewUserPrompt(e.target.value)}
                    placeholder="Enter user prompt"
                    className="bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500"
                  />
                </div>
                <Button onClick={handleSavePrompt} className="bg-green-600 hover:bg-green-700 text-gray-100">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}

export default SavedPrompts