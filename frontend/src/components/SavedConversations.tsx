import React from 'react'
import { Button } from "./ui/button/button"
import { MessageSquare, Trash } from 'lucide-react'

interface SavedConversationsProps {
  conversations: { id: number; title: string; messages: { role: string; content: string }[] }[]
  onLoadConversation: (conversationId: number) => void
  onDeleteConversation: (conversationId: number) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const SavedConversations: React.FC<SavedConversationsProps> = ({
  conversations,
  onLoadConversation,
  onDeleteConversation,
  isOpen,
  setIsOpen
}) => {
  return (
    <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] transition-all duration-300 ${isOpen ? 'w-64' : 'w-0'}`}>
      <Button
        className="absolute top-24 -left-12 bg-gray-800 hover:bg-gray-700 h-12 w-12 rounded-l-lg rounded-r-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
      {isOpen && (
        <div className="p-4 h-full w-64 bg-gray-800 overflow-y-auto">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-6 h-6 mr-2 text-gray-100" />
            <h2 className="text-xl font-bold text-gray-100">Saved Conversations</h2>
          </div>
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  onClick={() => onLoadConversation(conversation.id)} 
                  className="text-gray-300 hover:text-blue-400 hover:bg-gray-700"
                >
                  {conversation.title || `Conversation ${conversation.id}`}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onDeleteConversation(conversation.id)} 
                  className="text-gray-300 hover:text-red-400 hover:bg-gray-700"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SavedConversations