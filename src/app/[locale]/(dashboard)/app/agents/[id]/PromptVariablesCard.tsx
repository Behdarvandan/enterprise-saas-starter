"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";

interface PromptVariable {
  id: string;
  key: string;
  defaultValue: string;
}

interface PromptVariablesCardCopy {
  title: string;
  description: string;
  keyLabel: string;
  defaultValueLabel: string;
  addButton: string;
  removeButton: string;
}

let variableIdCounter = 0;
function createVariableId(): string {
  variableIdCounter += 1;
  return `var-${variableIdCounter}`;
}

const INITIAL_VARIABLES: PromptVariable[] = [
  { id: createVariableId(), key: "user_id", defaultValue: "" },
  { id: createVariableId(), key: "company_name", defaultValue: "Acme Inc." },
  { id: createVariableId(), key: "plan_tier", defaultValue: "pro" },
];

export default function PromptVariablesCard({ copy }: { copy: PromptVariablesCardCopy }) {
  const [variables, setVariables] = useState<PromptVariable[]>(INITIAL_VARIABLES);

  function updateVariable(id: string, field: "key" | "defaultValue", value: string) {
    setVariables((current) => current.map((variable) => (variable.id === id ? { ...variable, [field]: value } : variable)));
  }

  function removeVariable(id: string) {
    setVariables((current) => current.filter((variable) => variable.id !== id));
  }

  function addVariable() {
    setVariables((current) => [...current, { id: createVariableId(), key: "", defaultValue: "" }]);
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {variables.map((variable) => (
          <div key={variable.id} className="flex items-center gap-2">
            <Badge variant="outline" className="shrink-0 font-mono text-xs">
              {`{{${variable.key || "…"}}}`}
            </Badge>
            <Input
              value={variable.key}
              onChange={(event) => updateVariable(variable.id, "key", event.target.value)}
              placeholder={copy.keyLabel}
              aria-label={copy.keyLabel}
              className="min-w-0 flex-1 font-mono text-xs"
            />
            <Input
              value={variable.defaultValue}
              onChange={(event) => updateVariable(variable.id, "defaultValue", event.target.value)}
              placeholder={copy.defaultValueLabel}
              aria-label={copy.defaultValueLabel}
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => removeVariable(variable.id)}
              aria-label={copy.removeButton}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}

        <Button type="button" variant="secondary" size="sm" className="self-start" onClick={addVariable}>
          {copy.addButton}
        </Button>
      </CardContent>
    </Card>
  );
}
