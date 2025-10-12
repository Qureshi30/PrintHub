import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "password" | "select" | "textarea";
  placeholder?: string;
  value: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  disabled?: boolean;
}

interface AdminMobileFormProps {
  title: string;
  fields: FormField[];
  onFieldChange: (id: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  submitVariant?: "default" | "destructive";
}

export function AdminMobileForm({
  title,
  fields,
  onFieldChange,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isLoading = false,
  submitVariant = "default"
}: AdminMobileFormProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {field.type === "select" ? (
              <Select
                value={field.value}
                onValueChange={(value) => onFieldChange(field.id, value)}
                disabled={field.disabled}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "textarea" ? (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => onFieldChange(field.id, e.target.value)}
                disabled={field.disabled}
                className="min-h-[100px] text-base resize-none"
              />
            ) : (
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => onFieldChange(field.id, e.target.value)}
                disabled={field.disabled}
                className="h-12 text-base"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 h-12 text-base"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={submitVariant}
          onClick={onSubmit}
          disabled={isLoading}
          className={cn(
            "flex-1 h-12 text-base",
            submitVariant === "default" && "bg-red-600 hover:bg-red-700"
          )}
        >
          {isLoading ? "Loading..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}