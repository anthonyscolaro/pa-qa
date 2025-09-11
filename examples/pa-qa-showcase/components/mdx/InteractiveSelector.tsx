"use client"

import React, { useState } from 'react'
import { Check, ExternalLink, ArrowRight } from 'lucide-react'

interface SelectorOption {
  label: string
  value: string
  description: string
  icon?: string
  badge?: string
  disabled?: boolean
  href?: string
}

interface InteractiveSelectorProps {
  title: string
  options: SelectorOption[]
  onSelect?: (value: string, option: SelectorOption) => void
  multiple?: boolean
  defaultSelected?: string[]
  className?: string
  layout?: 'grid' | 'list'
  showDescription?: boolean
}

export function InteractiveSelector({
  title,
  options,
  onSelect,
  multiple = false,
  defaultSelected = [],
  className = '',
  layout = 'grid',
  showDescription = true
}: InteractiveSelectorProps) {
  const [selected, setSelected] = useState<string[]>(defaultSelected)
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  const handleSelect = (option: SelectorOption) => {
    if (option.disabled) return

    let newSelected: string[]
    
    if (multiple) {
      if (selected.includes(option.value)) {
        newSelected = selected.filter(s => s !== option.value)
      } else {
        newSelected = [...selected, option.value]
      }
    } else {
      newSelected = [option.value]
    }

    setSelected(newSelected)
    onSelect?.(option.value, option)
  }

  const isSelected = (value: string) => selected.includes(value)

  const gridCols = layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {multiple ? 'Select one or more options' : 'Select an option to continue'}
          </p>
          {selected.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {selected.length} selected
              </span>
              {!multiple && (
                <ArrowRight className="w-4 h-4 text-blue-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Options Grid */}
      <div className={`grid gap-4 ${gridCols}`}>
        {options.map((option) => {
          const isOptionSelected = isSelected(option.value)
          const isHovered = hoveredOption === option.value

          return (
            <div
              key={option.value}
              className={`
                relative group cursor-pointer rounded-lg border-2 transition-all duration-200
                ${isOptionSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${option.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-md'
                }
              `}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHoveredOption(option.value)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              {/* Selection Indicator */}
              <div className={`
                absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all
                ${isOptionSelected
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}>
                {isOptionSelected && (
                  <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                )}
              </div>

              {/* Badge */}
              {option.badge && (
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {option.badge}
                  </span>
                </div>
              )}

              <div className="p-4 pt-6">
                {/* Icon and Label */}
                <div className="flex items-start gap-3 mb-3">
                  {option.icon && (
                    <div className="text-2xl flex-shrink-0 mt-1">
                      {option.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {option.label}
                    </h4>
                    {showDescription && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* External Link Indicator */}
                {option.href && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Opens documentation
                    </span>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </div>
                )}

                {/* Hover Effect */}
                {isHovered && !option.disabled && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-5 rounded-lg pointer-events-none" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Summary */}
      {selected.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {multiple ? 'Selected Options:' : 'Selected Option:'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {selected.map((value) => {
              const option = options.find(opt => opt.value === value)
              if (!option) return null

              return (
                <div
                  key={value}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                >
                  {option.icon && <span>{option.icon}</span>}
                  <span>{option.label}</span>
                  {multiple && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(option)
                      }}
                      className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {selected.length > 0 && (
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setSelected([])}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Clear Selection
          </button>
          <button
            onClick={() => {
              const selectedOptions = options.filter(opt => selected.includes(opt.value))
              console.log('Proceeding with:', selectedOptions)
              // Here you could trigger navigation or other actions
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {options.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No options available</p>
        </div>
      )}
    </div>
  )
}