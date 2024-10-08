import React from 'react'
import { Button } from "./ui/button/button"
import { Slider } from "./ui/slider/slider"
import { Label } from "./ui/label/label"
import { Settings } from 'lucide-react'
import { ModelSettings as ModelSettingsType } from '../types'

interface ModelSettingsProps {
  model: string
  modelSettings: Record<string, ModelSettingsType>
  updateModelSetting: (setting: keyof ModelSettingsType, value: number) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const ModelSettings: React.FC<ModelSettingsProps> = ({ model, modelSettings, updateModelSetting, isOpen, setIsOpen }) => {
  const settings = modelSettings[model]

  return (
    <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] transition-all duration-300 ${isOpen ? 'w-64' : 'w-0'}`}>
      <Button
        className="absolute top-0 -left-12 bg-gray-800 hover:bg-gray-700 h-12 w-12 rounded-l-lg rounded-r-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings className="w-6 h-6" />
      </Button>
      {isOpen && (
        <div className="p-4 h-full w-64 bg-gray-800 overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Model Settings</h2>
          <div className="space-y-4">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-gray-300">{key}</Label>
                <Slider
                  id={key}
                  min={0}
                  max={key === 'temperature' || key === 'topP' ? 1 : 4096}
                  step={0.1}
                  value={[value]}
                  onValueChange={([newValue]) => updateModelSetting(key as keyof ModelSettingsType, newValue)}
                  className="bg-gray-800"
                />
                <span className="text-sm text-gray-400">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelSettings