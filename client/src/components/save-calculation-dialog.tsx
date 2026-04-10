import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SaveCalculationDialogProps {
  type: "throughput" | "linkbudget";
  parameters: any;
  results: any;
}

export function SaveCalculationDialog({ type, parameters, results }: SaveCalculationDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; parameters: any; results: any }) => {
      return await apiRequest("POST", "/api/calculations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
      toast({
        title: "Cálculo salvo",
        description: "Seu cenário foi salvo com sucesso",
      });
      setOpen(false);
      setName("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o cálculo",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para este cenário",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      type,
      parameters,
      results,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid={`button-save-${type}`}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Cenário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar Cálculo</DialogTitle>
          <DialogDescription>
            Salve este cenário de {type === "throughput" ? "throughput" : "link budget"} para uso posterior
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cenário</Label>
            <Input
              id="name"
              placeholder="Ex.: Urbano 5G @ 3.5GHz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              data-testid="input-scenario-name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-confirm-save"
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
