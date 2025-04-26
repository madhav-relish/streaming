"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

// List of available streaming services
const STREAMING_SERVICES = [
  { id: "netflix", name: "Netflix" },
  { id: "prime", name: "Amazon Prime" },
  { id: "hotstar", name: "Disney+ Hotstar" },
  { id: "zee5", name: "ZEE5" },
  { id: "sonyliv", name: "Sony LIV" },
  { id: "jiocinema", name: "JioCinema" },
  { id: "mxplayer", name: "MX Player" },
  { id: "voot", name: "Voot" },
  { id: "altbalaji", name: "ALTBalaji" },
  { id: "apple", name: "Apple TV+" },
  { id: "hbo", name: "HBO Max" },
  { id: "hulu", name: "Hulu" },
  { id: "peacock", name: "Peacock" },
  { id: "paramount", name: "Paramount+" },
  { id: "disney", name: "Disney+" },
];

// Global state to store selected services
export let selectedServices: string[] = [];

interface ServiceSelectorProps {
  isLoading: boolean;
}

export function ServiceSelector({ isLoading }: ServiceSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);

  // Update the global state when selection changes
  useEffect(() => {
    selectedServices = selected;
  }, [selected]);

  const toggleService = (serviceId: string) => {
    setSelected((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  return (
    <div className="border rounded-md p-3 bg-background">
      <ScrollArea className="h-[200px] pr-3">
        <div className="space-y-3">
          {STREAMING_SERVICES.map((service) => (
            <div key={service.id} className="flex items-center space-x-2">
              <Checkbox
                id={`service-${service.id}`}
                checked={selected.includes(service.id)}
                onCheckedChange={() => toggleService(service.id)}
                disabled={isLoading}
              />
              <Label
                htmlFor={`service-${service.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {service.name}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{selected.length} services selected</span>
        <button
          type="button"
          onClick={() => setSelected([])}
          className="text-primary hover:underline"
          disabled={isLoading || selected.length === 0}
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
