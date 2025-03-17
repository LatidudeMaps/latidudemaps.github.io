import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command as CommandPrimitive } from 'cmdk';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TechFilterProps {
  technologies: string[];
  selectedTech: string | null;
  onTechChange: (tech: string | null) => void;
}

export default function TechFilter({ technologies, selectedTech, onTechChange }: TechFilterProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between min-w-[200px]"
        >
          {selectedTech
            ? technologies.find((tech) => tech === selectedTech)
            : "Filtra per tecnologia..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[200px] p-0 bg-background border shadow-md"
        align="start"
      >
        <CommandPrimitive className="overflow-hidden rounded-md">
          <CommandPrimitive.Input 
            placeholder="Cerca tecnologia..."
            className="border-0 px-4 py-2 outline-none focus:ring-0 bg-background"
          />
          <CommandPrimitive.List>
            <CommandPrimitive.Empty className="py-6 text-center text-sm">
              Nessuna tecnologia trovata.
            </CommandPrimitive.Empty>
            {technologies.map((tech) => (
              <CommandPrimitive.Item
                key={tech}
                onSelect={() => {
                  onTechChange(tech === selectedTech ? null : tech);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-4 py-2 text-sm outline-none",
                  "data-[selected]:bg-primary data-[selected]:text-primary-foreground",
                  "hover:bg-accent hover:text-accent-foreground",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedTech === tech ? "opacity-100" : "opacity-0"
                  )}
                />
                {tech}
              </CommandPrimitive.Item>
            ))}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}