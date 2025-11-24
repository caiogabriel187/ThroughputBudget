import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, Search, Radio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Calculation } from "@shared/schema";
import { format } from "date-fns";

interface CalculationHistoryProps {
  type?: "throughput" | "linkbudget";
  onLoad: (calculation: Calculation) => void;
}

export function CalculationHistory({ type, onLoad }: CalculationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: calculations = [], isLoading } = useQuery<Calculation[]>({
    queryKey: ["/api/calculations", type],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (type) queryParams.set("type", type);
      const url = `/api/calculations?${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load calculations");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/calculations/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
      toast({
        title: "Deleted",
        description: "Calculation removed from history",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Could not delete calculation",
        variant: "destructive",
      });
    },
  });

  const filteredCalculations = calculations.filter((calc) =>
    calc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Calculation History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search scenarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-history"
          />
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Loading history...
          </div>
        ) : filteredCalculations.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            {searchQuery ? "No matching scenarios" : "No saved calculations yet"}
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredCalculations.map((calc) => (
                <div
                  key={calc.id}
                  className="flex items-start gap-3 p-3 rounded-md border hover-elevate active-elevate-2"
                  data-testid={`history-item-${calc.id}`}
                >
                  <Radio className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{calc.name}</h4>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {calc.type === "throughput" ? "Throughput" : "Link Budget"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(calc.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onLoad(calc)}
                      data-testid={`button-load-${calc.id}`}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(calc.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${calc.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
