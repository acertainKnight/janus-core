import React from 'react'
import { Button } from "../components/ui/button/button"
import { Save, RefreshCw, GitFork } from 'lucide-react'

interface ActionToolbarProps {
  handleSavePrompt: () => void
  handleSaveConversation: () => void
  handleForkConversation: () => void
  handleRegenerate: () => void
  isGenerating: boolean
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({
  handleSavePrompt,
  handleSaveConversation,
  handleForkConversation,
  handleRegenerate,
  isGenerating
}) => {
  return (
    <div className="flex space-x-2">
      <Button onClick={handleSavePrompt} className="bg-green-600 hover:bg-green-700 text-gray-100">
        <Save className="w-4 h-4 mr-2" />Save Prompt
      </Button>
      <Button onClick={handleSaveConversation} className="bg-blue-600 hover:bg-blue-700 text-gray-100">
        <Save className="w-4 h-4 mr-2" />Save Conversation
      </Button>
      <Button onClick={handleForkConversation} className="bg-purple-600 hover:bg-purple-700 text-gray-100">
        <GitFork className="w-4 h-4 mr-2" />Fork Conversation
      </Button>
      <Button 
        onClick={handleRegenerate} 
        className="bg-yellow-600 hover:bg-yellow-700 text-gray-100"
        disabled={isGenerating}
      >
        <RefreshCw className="w-4 h-4 mr-2" />Regenerate
      </Button>
    </div>
  )
}

export default ActionToolbar
