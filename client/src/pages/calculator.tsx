import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, BarChart2, Zap, Radio, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SaveCalculationDialog } from "@/components/save-calculation-dialog";
import { CalculationHistory } from "@/components/calculation-history";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import type { Calculation } from "@shared/schema";

// ─── Modelos de Perda de Percurso ────────────────────────────────────────────
function fspl(d_km: number, f_mhz: number): number {
  if (d_km <= 0) return 0;
  return 20 * Math.log10(d_km) + 20 * Math.log10(f_mhz) + 32.44;
}

function uma_los(d_km: number, f_mhz: number, hBS = 25, hUT = 1.5): number {
  const d_m = d_km * 1000;
  const f_ghz = f_mhz / 1000;
  const d3D = Math.sqrt(d_m * d_m + (hBS - hUT) ** 2);
  return 28.0 + 22 * Math.log10(Math.max(d3D, 1)) + 20 * Math.log10(f_ghz);
}

function uma_nlos(d_km: number, f_mhz: number, hBS = 25, hUT = 1.5): number {
  const d_m = d_km * 1000;
  const f_ghz = f_mhz / 1000;
  const d3D = Math.sqrt(d_m * d_m + (hBS - hUT) ** 2);
  const pl_nlos = 13.54 + 39.08 * Math.log10(Math.max(d3D, 1)) + 20 * Math.log10(f_ghz) - 0.6 * (hUT - 1.5);
  return Math.max(pl_nlos, uma_los(d_km, f_mhz, hBS, hUT));
}

function umi_los(d_km: number, f_mhz: number, hBS = 10, hUT = 1.5): number {
  const d_m = d_km * 1000;
  const f_ghz = f_mhz / 1000;
  const d3D = Math.sqrt(d_m * d_m + (hBS - hUT) ** 2);
  return 32.4 + 21 * Math.log10(Math.max(d3D, 1)) + 20 * Math.log10(f_ghz);
}

function umi_nlos(d_km: number, f_mhz: number, hBS = 10, hUT = 1.5): number {
  const d_m = d_km * 1000;
  const f_ghz = f_mhz / 1000;
  const d3D = Math.sqrt(d_m * d_m + (hBS - hUT) ** 2);
  const pl_nlos = 35.3 * Math.log10(Math.max(d3D, 1)) + 22.4 + 21.3 * Math.log10(f_ghz) - 0.3 * (hUT - 1.5);
  return Math.max(pl_nlos, umi_los(d_km, f_mhz, hBS, hUT));
}

function rma_los(d_km: number, f_mhz: number, h = 5): number {
  const d_m = d_km * 1000;
  const f_ghz = f_mhz / 1000;
  const a = Math.min(0.03 * h ** 1.72, 10);
  const b = Math.min(0.044 * h ** 1.72, 14.77);
  return 20 * Math.log10((40 * Math.PI * Math.max(d_m, 1) * f_ghz) / 3)
    + a * Math.log10(Math.max(d_m, 1))
    - b
    + 0.002 * Math.log10(h) * Math.max(d_m, 1);
}

function indoor_los(d_km: number, f_mhz: number): number {
  const d_m = d_km * 1000;
  const f_ghz = f_mhz / 1000;
  return 32.4 + 17.3 * Math.log10(Math.max(d_m, 1)) + 20 * Math.log10(f_ghz);
}

function computePathLoss(model: string, d_km: number, f_mhz: number, customPL = 120): number {
  switch (model) {
    case "fspl": return fspl(Math.max(0.001, d_km), f_mhz);
    case "uma_los": return uma_los(Math.max(0.001, d_km), f_mhz);
    case "uma_nlos": return uma_nlos(Math.max(0.001, d_km), f_mhz);
    case "umi_los": return umi_los(Math.max(0.001, d_km), f_mhz);
    case "umi_nlos": return umi_nlos(Math.max(0.001, d_km), f_mhz);
    case "rma_los": return rma_los(Math.max(0.001, d_km), f_mhz);
    case "indoor_los": return indoor_los(Math.max(0.001, d_km), f_mhz);
    case "custom": return customPL;
    default: return fspl(Math.max(0.001, d_km), f_mhz);
  }
}

// ─── Presets de Fabricantes ───────────────────────────────────────────────────
const VENDOR_PRESETS = {
  ericsson: {
    label: "Ericsson AIR 6449",
    description: "3,5 GHz, 100 MHz TDD, 8×8 MIMO, 256QAM",
    params: {
      fr: "FR1", fddTdd: "TDD", numerology: 1, scs: 30, bwMHz: 100,
      aggregatedCarriers: 1, mimoLayers: 8, modulation: "256QAM",
      codeRate: 0.9258, tbsScaling: 1.0, numBeams: 1, slotFormat: "mixed",
      customDlFraction: 0.75, manualPRBs: "", signalingOverhead: 0.14,
    },
  },
  nokia: {
    label: "Nokia AirScale",
    description: "3,5 GHz, 100 MHz TDD, CA×2, 256QAM",
    params: {
      fr: "FR1", fddTdd: "TDD", numerology: 1, scs: 30, bwMHz: 100,
      aggregatedCarriers: 2, mimoLayers: 8, modulation: "256QAM",
      codeRate: 0.9258, tbsScaling: 1.0, numBeams: 1, slotFormat: "mixed",
      customDlFraction: 0.75, manualPRBs: "", signalingOverhead: 0.14,
    },
  },
  huawei: {
    label: "Huawei AAU5636",
    description: "2,6 GHz, 100 MHz TDD, 64T64R, 256QAM",
    params: {
      fr: "FR1", fddTdd: "TDD", numerology: 1, scs: 30, bwMHz: 100,
      aggregatedCarriers: 1, mimoLayers: 16, modulation: "256QAM",
      codeRate: 0.9258, tbsScaling: 1.0, numBeams: 1, slotFormat: "45",
      customDlFraction: 0.75, manualPRBs: "", signalingOverhead: 0.14,
    },
  },
  samsung: {
    label: "Samsung mmWave",
    description: "28 GHz, 400 MHz TDD, FR2, 256QAM",
    params: {
      fr: "FR2", fddTdd: "TDD", numerology: 3, scs: 120, bwMHz: 400,
      aggregatedCarriers: 1, mimoLayers: 4, modulation: "256QAM",
      codeRate: 0.9258, tbsScaling: 1.0, numBeams: 1, slotFormat: "mixed",
      customDlFraction: 0.75, manualPRBs: "", signalingOverhead: 0.14,
    },
  },
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Calculator() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"throughput" | "linkbudget">("throughput");
  const [activeSection, setActiveSection] = useState<"calc" | "charts">("calc");

  // Estado — Throughput
  const [fr, setFr] = useState("FR1");
  const [fddTdd, setFddTdd] = useState("FDD");
  const [numerology, setNumerology] = useState(1);
  const [scs, setScs] = useState(30);
  const [bwMHz, setBwMHz] = useState(100);
  const [aggregatedCarriers, setAggregatedCarriers] = useState(1);
  const [mimoLayers, setMimoLayers] = useState(2);
  const [modulation, setModulation] = useState("256QAM");
  const [codeRate, setCodeRate] = useState(948 / 1024);
  const [tbsScaling, setTbsScaling] = useState(1.0);
  const [numBeams, setNumBeams] = useState(1);
  const [slotFormat, setSlotFormat] = useState("fullDL");
  const [customDlFraction, setCustomDlFraction] = useState(1.0);
  const [manualPRBs, setManualPRBs] = useState("");
  const [signalingOverhead, setSignalingOverhead] = useState(0.14);

  // Estado — Link Budget
  const [txPower, setTxPower] = useState(30);
  const [txGain, setTxGain] = useState(15);
  const [rxGain, setRxGain] = useState(0);
  const [txCableLoss, setTxCableLoss] = useState(0);
  const [rxCableLoss, setRxCableLoss] = useState(0);
  const [otherLosses, setOtherLosses] = useState(2);
  const [frequency, setFrequency] = useState(3500);
  const [distanceKm, setDistanceKm] = useState(0.2);
  const [pathModel, setPathModel] = useState("fspl");
  const [customPathLoss, setCustomPathLoss] = useState(120);
  const [noiseFigure, setNoiseFigure] = useState(7);
  const [rbBandwidthMHz, setRbBandwidthMHz] = useState(20);

  // ─── Cálculos de Throughput ─────────────────────────────────────────────
  const modulationBits = useMemo(() => {
    switch (modulation) {
      case "QPSK": return 2;
      case "16QAM": return 4;
      case "64QAM": return 6;
      case "256QAM": return 8;
      case "1024QAM": return 10;
      default: return 6;
    }
  }, [modulation]);

  const prbs = useMemo(() => {
    if (manualPRBs) return Math.max(0, Math.floor(Number(manualPRBs) || 0));
    const totalKHz = Math.max(1, bwMHz * 1000);
    const rbKHz = 12 * Math.max(1, scs);
    return Math.max(0, Math.floor(totalKHz / rbKHz));
  }, [bwMHz, scs, manualPRBs]);

  const dlFraction = useMemo(() => {
    if (fddTdd === "FDD") return 1.0;
    if (slotFormat === "45") return 6 / 14;
    if (slotFormat === "special") return customDlFraction;
    if (slotFormat === "fullDL") return 1.0;
    if (slotFormat === "mixed") return 0.75;
    return 1.0;
  }, [fddTdd, slotFormat, customDlFraction]);

  const spectralEfficiency = useMemo(
    () => modulationBits * codeRate * mimoLayers * tbsScaling,
    [modulationBits, codeRate, mimoLayers, tbsScaling]
  );

  const throughputMbps = useMemo(() => {
    const raw = bwMHz * spectralEfficiency * dlFraction * (1 - signalingOverhead) * aggregatedCarriers;
    return Number.isFinite(raw) ? raw : 0;
  }, [bwMHz, spectralEfficiency, dlFraction, signalingOverhead, aggregatedCarriers]);

  // ─── Cálculos de Link Budget ────────────────────────────────────────────
  const pathLoss = useMemo(
    () => computePathLoss(pathModel, distanceKm, frequency, customPathLoss),
    [pathModel, distanceKm, frequency, customPathLoss]
  );

  const receivedPower = useMemo(
    () => txPower - txCableLoss + txGain - pathLoss + rxGain - rxCableLoss - otherLosses,
    [txPower, txCableLoss, txGain, pathLoss, rxGain, rxCableLoss, otherLosses]
  );

  const noiseFloor = useMemo(() => {
    const B = Math.max(1e3, rbBandwidthMHz * 1e6);
    const thermal = -174 + 10 * Math.log10(B);
    return thermal + noiseFigure;
  }, [rbBandwidthMHz, noiseFigure]);

  const sinrDb = useMemo(() => receivedPower - noiseFloor, [receivedPower, noiseFloor]);

  // ─── Dados dos Gráficos ──────────────────────────────────────────────────
  const throughputChartData = useMemo(() => {
    const bandwidths = [5, 10, 15, 20, 25, 40, 50, 60, 80, 100, 200, 400];
    return bandwidths.map((bw) => {
      const tp = bw * spectralEfficiency * dlFraction * (1 - signalingOverhead) * aggregatedCarriers;
      return { bw, throughput: Number.isFinite(tp) ? parseFloat(tp.toFixed(1)) : 0 };
    });
  }, [scs, spectralEfficiency, dlFraction, signalingOverhead, aggregatedCarriers]);

  const pathLossChartData = useMemo(() => {
    const distances = [0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0];
    return distances.map((d) => ({
      d,
      FSPL: parseFloat(fspl(d, frequency).toFixed(1)),
      "UMa LOS": parseFloat(uma_los(d, frequency).toFixed(1)),
      "UMa NLOS": parseFloat(uma_nlos(d, frequency).toFixed(1)),
      "UMi LOS": parseFloat(umi_los(d, frequency).toFixed(1)),
      "RMa LOS": parseFloat(rma_los(d, frequency).toFixed(1)),
      Indoor: parseFloat(indoor_los(d, frequency).toFixed(1)),
    }));
  }, [frequency]);

  // ─── Aplicar Preset de Fabricante ──────────────────────────────────────
  function applyVendorPreset(key: keyof typeof VENDOR_PRESETS) {
    const p = VENDOR_PRESETS[key].params;
    setFr(p.fr);
    setFddTdd(p.fddTdd);
    setNumerology(p.numerology);
    setScs(p.scs);
    setBwMHz(p.bwMHz);
    setAggregatedCarriers(p.aggregatedCarriers);
    setMimoLayers(p.mimoLayers);
    setModulation(p.modulation);
    setCodeRate(p.codeRate);
    setTbsScaling(p.tbsScaling);
    setNumBeams(p.numBeams);
    setSlotFormat(p.slotFormat);
    setCustomDlFraction(p.customDlFraction);
    setManualPRBs(p.manualPRBs);
    setSignalingOverhead(p.signalingOverhead);
    setMode("throughput");
    toast({ title: "Preset carregado", description: VENDOR_PRESETS[key].label });
  }

  // ─── Exportar CSV ───────────────────────────────────────────────────────
  function downloadCSV(rows: (string | number)[][], filename = "export.csv") {
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportThroughputCSV() {
    downloadCSV([
      ["Parâmetro", "Valor"],
      ["Faixa de Frequência", fr],
      ["Modo Duplex", fddTdd],
      ["Numerologia", numerology],
      ["Espaçamento de Subportadora (kHz)", scs],
      ["Largura de Banda (MHz)", bwMHz],
      ["Portadoras Agregadas", aggregatedCarriers],
      ["PRBs (estimado)", prbs],
      ["Modulação", modulation],
      ["Taxa de Código", codeRate.toFixed(4)],
      ["Camadas MIMO", mimoLayers],
      ["Escala TBS", tbsScaling],
      ["Fração DL", dlFraction.toFixed(3)],
      ["Overhead de Sinalização", signalingOverhead],
      ["Eficiência Espectral (bits/s/Hz)", spectralEfficiency.toFixed(3)],
      ["Throughput (Mbps)", throughputMbps.toFixed(2)],
    ], "5g-throughput-export.csv");
    toast({ title: "Exportação concluída", description: "Dados de throughput exportados para CSV" });
  }

  function exportLinkBudgetCSV() {
    downloadCSV([
      ["Parâmetro", "Valor"],
      ["Potência Tx (dBm)", txPower],
      ["Ganho Tx (dBi)", txGain],
      ["Perda no Cabo Tx (dB)", txCableLoss],
      ["Ganho Rx (dBi)", rxGain],
      ["Perda no Cabo Rx (dB)", rxCableLoss],
      ["Outras Perdas (dB)", otherLosses],
      ["Frequência (MHz)", frequency],
      ["Distância (km)", distanceKm],
      ["Modelo de Perda de Percurso", pathModel.toUpperCase()],
      ["Perda de Percurso (dB)", pathLoss.toFixed(2)],
      ["Potência Recebida (dBm)", receivedPower.toFixed(2)],
      ["Figura de Ruído (dB)", noiseFigure],
      ["Largura de Banda do Receptor (MHz)", rbBandwidthMHz],
      ["Piso de Ruído (dBm)", noiseFloor.toFixed(2)],
      ["SINR (dB)", sinrDb.toFixed(2)],
    ], "5g-linkbudget-export.csv");
    toast({ title: "Exportação concluída", description: "Dados de link budget exportados para CSV" });
  }

  function copyThroughputResults() {
    const text = `Resultados de Throughput 5G NR\nThroughput: ${throughputMbps.toFixed(2)} Mbps\nPRBs: ${prbs}\nEficiência Espectral: ${spectralEfficiency.toFixed(3)} bits/s/Hz\nFração DL: ${dlFraction.toFixed(3)}`;
    navigator.clipboard?.writeText(text).then(
      () => toast({ title: "Copiado!", description: "Resultados copiados para a área de transferência" }),
      () => toast({ title: "Falha ao copiar", description: "Não foi possível copiar", variant: "destructive" })
    );
  }

  function copyLinkBudgetResults() {
    const text = `Resultados de Link Budget 5G NR\nPotência Recebida: ${receivedPower.toFixed(2)} dBm\nPerda de Percurso: ${pathLoss.toFixed(2)} dB\nPiso de Ruído: ${noiseFloor.toFixed(2)} dBm\nSINR: ${sinrDb.toFixed(2)} dB`;
    navigator.clipboard?.writeText(text).then(
      () => toast({ title: "Copiado!", description: "Resultados copiados para a área de transferência" }),
      () => toast({ title: "Falha ao copiar", description: "Não foi possível copiar", variant: "destructive" })
    );
  }

  // ─── Carregar do Histórico ──────────────────────────────────────────────
  function loadCalculation(calculation: Calculation) {
    if (calculation.type === "throughput") {
      const p = calculation.parameters as any;
      setFr(p.fr); setFddTdd(p.fddTdd); setNumerology(p.numerology); setScs(p.scs);
      setBwMHz(p.bandwidth); setAggregatedCarriers(p.carriers); setManualPRBs(p.manualPRBs || "");
      setModulation(p.modulation); setCodeRate(p.codeRate); setMimoLayers(p.mimoLayers);
      setTbsScaling(p.tbsScaling); setNumBeams(p.numBeams); setSlotFormat(p.slotFormat);
      if (p.customDlFraction !== undefined) setCustomDlFraction(p.customDlFraction);
      setSignalingOverhead(p.signalingOverhead);
      setMode("throughput");
    } else {
      const p = calculation.parameters as any;
      setTxPower(p.txPower); setTxGain(p.txGain); setTxCableLoss(p.txCableLoss);
      setRxGain(p.rxGain); setRxCableLoss(p.rxCableLoss); setOtherLosses(p.otherLosses);
      setFrequency(p.frequency); setDistanceKm(p.distance); setPathModel(p.pathModel);
      if (p.customPathLoss !== undefined) setCustomPathLoss(p.customPathLoss);
      setNoiseFigure(p.noiseFigure); setRbBandwidthMHz(p.rbBandwidthMHz);
      setMode("linkbudget");
    }
    toast({ title: "Cenário carregado", description: `"${calculation.name}" carregado com sucesso` });
  }

  const throughputData = {
    parameters: {
      fr, fddTdd, numerology, scs, bandwidth: bwMHz, carriers: aggregatedCarriers,
      manualPRBs, modulation, codeRate, mimoLayers, tbsScaling, numBeams,
      slotFormat, customDlFraction, signalingOverhead,
    },
    results: { prbs, spectralEfficiency, dlFraction, throughput: throughputMbps },
  };

  const linkBudgetData = {
    parameters: {
      txPower, txGain, txCableLoss, rxGain, rxCableLoss, otherLosses,
      frequency, distance: distanceKm, pathModel, customPathLoss, noiseFigure, rbBandwidthMHz,
    },
    results: { pathLoss, receivedPower, noiseFloor, sinr: sinrDb },
  };

  const sinrQuality = sinrDb >= 20 ? { label: "Excelente", color: "text-green-600" }
    : sinrDb >= 10 ? { label: "Bom", color: "text-blue-600" }
    : sinrDb >= 0 ? { label: "Marginal", color: "text-yellow-600" }
    : { label: "Ruim", color: "text-red-600" };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Cabeçalho */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-1">Calculadora 5G NR</h1>
            <p className="text-sm text-muted-foreground">
              Análise profissional de throughput e link budget para engenheiros de RF
            </p>
          </div>
          <a
            href="/mobile"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium no-underline hover:opacity-90 transition-opacity"
            data-testid="link-mobile-app"
          >
            <Smartphone className="w-4 h-4" />
            Aplicativo Mobile
          </a>
        </div>

        {/* Presets de Fabricantes */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Presets de Fabricantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(VENDOR_PRESETS) as (keyof typeof VENDOR_PRESETS)[]).map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => applyVendorPreset(key)}
                  data-testid={`preset-${key}`}
                  className="flex flex-col items-start h-auto py-2 px-3"
                >
                  <span className="font-medium">{VENDOR_PRESETS[key].label}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {VENDOR_PRESETS[key].description}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Área Principal */}
          <div className="lg:col-span-2 space-y-4">
            {/* Alternar Seção */}
            <div className="flex gap-2">
              <Button
                variant={activeSection === "calc" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection("calc")}
                data-testid="button-section-calc"
              >
                Calculadora
              </Button>
              <Button
                variant={activeSection === "charts" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection("charts")}
                data-testid="button-section-charts"
              >
                <BarChart2 className="w-4 h-4 mr-1" />
                Gráficos
              </Button>
            </div>

            {activeSection === "calc" && (
              <Tabs value={mode} onValueChange={(v) => setMode(v as "throughput" | "linkbudget")} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-6" data-testid="tabs-mode-switcher">
                  <TabsTrigger value="throughput" data-testid="tab-throughput">Throughput</TabsTrigger>
                  <TabsTrigger value="linkbudget" data-testid="tab-linkbudget">Link Budget</TabsTrigger>
                </TabsList>

                {/* ── Calculadora de Throughput ── */}
                <TabsContent value="throughput" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Parâmetros de Throughput</CardTitle>
                      <CardDescription>Configure os parâmetros da camada física 5G NR</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Col 1: RF */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="fr">Faixa de Frequência</Label>
                            <Select value={fr} onValueChange={setFr}>
                              <SelectTrigger id="fr" data-testid="select-fr"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FR1">FR1 (Sub-6 GHz)</SelectItem>
                                <SelectItem value="FR2">FR2 (mmWave)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fddtdd">Modo Duplex</Label>
                            <Select value={fddTdd} onValueChange={setFddTdd}>
                              <SelectTrigger id="fddtdd" data-testid="select-duplex"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FDD">FDD</SelectItem>
                                <SelectItem value="TDD">TDD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="numerology">Numerologia (μ)</Label>
                            <Input id="numerology" type="number" min="0" max="4" value={numerology}
                              onChange={(e) => setNumerology(Number(e.target.value))} data-testid="input-numerology" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="scs">Espaçamento de Subportadora (kHz)</Label>
                            <Select value={String(scs)} onValueChange={(v) => setScs(Number(v))}>
                              <SelectTrigger id="scs" data-testid="select-scs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                                <SelectItem value="60">60</SelectItem>
                                <SelectItem value="120">120</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bandwidth">Largura de Banda (MHz)</Label>
                            <Input id="bandwidth" type="number" value={bwMHz}
                              onChange={(e) => setBwMHz(Number(e.target.value))} data-testid="input-bandwidth" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="carriers">Portadoras Agregadas</Label>
                            <Input id="carriers" type="number" min="1" value={aggregatedCarriers}
                              onChange={(e) => setAggregatedCarriers(Number(e.target.value))} data-testid="input-carriers" />
                          </div>
                        </div>

                        {/* Col 2: Modulação */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="prbs">PRBs (deixe vazio para automático)</Label>
                            <Input id="prbs" type="text" placeholder="Calculado automaticamente" value={manualPRBs}
                              onChange={(e) => setManualPRBs(e.target.value)} data-testid="input-prbs" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="modulation">Modulação</Label>
                            <Select value={modulation} onValueChange={setModulation}>
                              <SelectTrigger id="modulation" data-testid="select-modulation"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="QPSK">QPSK</SelectItem>
                                <SelectItem value="16QAM">16QAM</SelectItem>
                                <SelectItem value="64QAM">64QAM</SelectItem>
                                <SelectItem value="256QAM">256QAM</SelectItem>
                                <SelectItem value="1024QAM">1024QAM</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="coderate">Taxa de Código</Label>
                            <Input id="coderate" type="number" step="0.001" min="0" max="1" value={codeRate}
                              onChange={(e) => setCodeRate(Number(e.target.value))} data-testid="input-coderate" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mimo">Camadas MIMO</Label>
                            <Input id="mimo" type="number" min="1" value={mimoLayers}
                              onChange={(e) => setMimoLayers(Number(e.target.value))} data-testid="input-mimo" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tbsscaling">Escala TBS</Label>
                            <Input id="tbsscaling" type="number" step="0.01" value={tbsScaling}
                              onChange={(e) => setTbsScaling(Number(e.target.value))} data-testid="input-tbs" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="beams">Número de Feixes</Label>
                            <Input id="beams" type="number" min="1" value={numBeams}
                              onChange={(e) => setNumBeams(Number(e.target.value))} data-testid="input-beams" />
                          </div>
                        </div>

                        {/* Col 3: TDD */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="slotformat">Formato de Slot TDD</Label>
                            <Select value={slotFormat} onValueChange={setSlotFormat}>
                              <SelectTrigger id="slotformat" data-testid="select-slotformat"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fullDL">Todo DL (ou FDD)</SelectItem>
                                <SelectItem value="mixed">Misto DL/UL (75%)</SelectItem>
                                <SelectItem value="45">Padrão 45 (43%)</SelectItem>
                                <SelectItem value="special">Fração DL Personalizada</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {slotFormat === "special" && (
                            <div className="space-y-2">
                              <Label htmlFor="dlfraction">Fração DL (0–1)</Label>
                              <Input id="dlfraction" type="number" step="0.01" min="0" max="1" value={customDlFraction}
                                onChange={(e) => setCustomDlFraction(Number(e.target.value))} data-testid="input-dlfraction" />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="overhead">Overhead de Sinalização</Label>
                            <Input id="overhead" type="number" step="0.01" min="0" max="1" value={signalingOverhead}
                              onChange={(e) => setSignalingOverhead(Number(e.target.value))} data-testid="input-overhead" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resultados de Throughput */}
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle>Resultados</CardTitle>
                      <CardDescription>Throughput calculado e valores intermediários</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">PRBs Estimados</div>
                          <div className="text-2xl font-mono font-semibold" data-testid="result-prbs">{prbs}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Eficiência Espectral</div>
                          <div className="text-2xl font-mono font-semibold" data-testid="result-spectral">
                            {spectralEfficiency.toFixed(3)}
                          </div>
                          <div className="text-xs text-muted-foreground">bits/s/Hz</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Fração DL</div>
                          <div className="text-2xl font-mono font-semibold" data-testid="result-dlfraction">
                            {dlFraction.toFixed(3)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Throughput</div>
                          <div className="text-3xl font-mono font-bold text-primary" data-testid="result-throughput">
                            {throughputMbps.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">Mbps</div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <SaveCalculationDialog type="throughput" parameters={throughputData.parameters} results={throughputData.results} />
                        <Button variant="default" onClick={copyThroughputResults} data-testid="button-copy-throughput">
                          <Copy className="w-4 h-4 mr-2" />Copiar Resultados
                        </Button>
                        <Button variant="secondary" onClick={exportThroughputCSV} data-testid="button-export-throughput">
                          <Download className="w-4 h-4 mr-2" />Exportar CSV
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Metodologia aproximada 3GPP. Estimativa de PRB usa LB / (12 × SCS). Consulte 3GPP TS 38.306 para cálculos de produção.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ── Calculadora de Link Budget ── */}
                <TabsContent value="linkbudget" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Parâmetros de Link Budget</CardTitle>
                      <CardDescription>Configure os parâmetros de transmissão, recepção e propagação</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Col 1 */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-muted-foreground">Transmissor</h3>
                          <div className="space-y-2">
                            <Label htmlFor="txpower">Potência Tx (dBm)</Label>
                            <Input id="txpower" type="number" value={txPower}
                              onChange={(e) => setTxPower(Number(e.target.value))} data-testid="input-txpower" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="txgain">Ganho Tx (dBi)</Label>
                            <Input id="txgain" type="number" value={txGain}
                              onChange={(e) => setTxGain(Number(e.target.value))} data-testid="input-txgain" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="txcableloss">Perda no Cabo Tx (dB)</Label>
                            <Input id="txcableloss" type="number" value={txCableLoss}
                              onChange={(e) => setTxCableLoss(Number(e.target.value))} data-testid="input-txcableloss" />
                          </div>
                          <h3 className="text-sm font-medium text-muted-foreground pt-4">Propagação</h3>
                          <div className="space-y-2">
                            <Label htmlFor="freq">Frequência (MHz)</Label>
                            <Input id="freq" type="number" value={frequency}
                              onChange={(e) => setFrequency(Number(e.target.value))} data-testid="input-frequency" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="distance">Distância (km)</Label>
                            <Input id="distance" type="number" step="0.001" value={distanceKm}
                              onChange={(e) => setDistanceKm(Number(e.target.value))} data-testid="input-distance" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pathmodel">Modelo de Perda de Percurso</Label>
                            <Select value={pathModel} onValueChange={setPathModel}>
                              <SelectTrigger id="pathmodel" data-testid="select-pathmodel"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fspl">FSPL (Espaço Livre)</SelectItem>
                                <SelectItem value="uma_los">3GPP UMa LOS</SelectItem>
                                <SelectItem value="uma_nlos">3GPP UMa NLOS</SelectItem>
                                <SelectItem value="umi_los">3GPP UMi LOS</SelectItem>
                                <SelectItem value="umi_nlos">3GPP UMi NLOS</SelectItem>
                                <SelectItem value="rma_los">3GPP RMa LOS</SelectItem>
                                <SelectItem value="indoor_los">3GPP Indoor LOS</SelectItem>
                                <SelectItem value="custom">Perda Personalizada</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {pathModel === "custom" && (
                            <div className="space-y-2">
                              <Label htmlFor="custompathloss">Perda de Percurso Personalizada (dB)</Label>
                              <Input id="custompathloss" type="number" value={customPathLoss}
                                onChange={(e) => setCustomPathLoss(Number(e.target.value))} data-testid="input-custompathloss" />
                            </div>
                          )}
                        </div>

                        {/* Col 2 */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-muted-foreground">Receptor</h3>
                          <div className="space-y-2">
                            <Label htmlFor="rxgain">Ganho Rx (dBi)</Label>
                            <Input id="rxgain" type="number" value={rxGain}
                              onChange={(e) => setRxGain(Number(e.target.value))} data-testid="input-rxgain" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rxcableloss">Perda no Cabo Rx (dB)</Label>
                            <Input id="rxcableloss" type="number" value={rxCableLoss}
                              onChange={(e) => setRxCableLoss(Number(e.target.value))} data-testid="input-rxcableloss" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="otherloss">Outras Perdas (dB)</Label>
                            <Input id="otherloss" type="number" value={otherLosses}
                              onChange={(e) => setOtherLosses(Number(e.target.value))} data-testid="input-otherloss" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="noisefig">Figura de Ruído (dB)</Label>
                            <Input id="noisefig" type="number" value={noiseFigure}
                              onChange={(e) => setNoiseFigure(Number(e.target.value))} data-testid="input-noisefig" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rxbandwidth">Largura de Banda do Receptor (MHz)</Label>
                            <Input id="rxbandwidth" type="number" value={rbBandwidthMHz}
                              onChange={(e) => setRbBandwidthMHz(Number(e.target.value))} data-testid="input-rxbandwidth" />
                          </div>
                          {/* Informações do modelo de perda */}
                          <div className="mt-4 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground space-y-1">
                            <div className="font-medium text-foreground">Referência do Modelo</div>
                            {pathModel === "fspl" && <p>Perda no Espaço Livre. Assume LOS limpa, sem reflexões.</p>}
                            {pathModel.startsWith("uma") && <p>3GPP TR 38.901 Macro Urbano: hBS=25m, hUT=1,5m.</p>}
                            {pathModel.startsWith("umi") && <p>3GPP TR 38.901 Micro Urbano: hBS=10m, hUT=1,5m.</p>}
                            {pathModel === "rma_los" && <p>3GPP TR 38.901 Macro Rural LOS: altura média de edificações 5m.</p>}
                            {pathModel === "indoor_los" && <p>3GPP TR 38.901 Indoor (Fábrica) LOS.</p>}
                            {pathModel === "custom" && <p>Valor de perda de percurso definido pelo usuário.</p>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resultados de Link Budget */}
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle>Resultados</CardTitle>
                      <CardDescription>Link budget calculado e qualidade do sinal</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Perda de Percurso</div>
                          <div className="text-2xl font-mono font-semibold" data-testid="result-pathloss">
                            {pathLoss.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">dB</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Potência Recebida</div>
                          <div className="text-2xl font-mono font-semibold text-primary" data-testid="result-rxpower">
                            {receivedPower.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">dBm</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Piso de Ruído</div>
                          <div className="text-2xl font-mono font-semibold" data-testid="result-noisefloor">
                            {noiseFloor.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">dBm</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">SINR</div>
                          <div className={`text-3xl font-mono font-bold ${sinrQuality.color}`} data-testid="result-sinr">
                            {sinrDb.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-xs text-muted-foreground">dB</div>
                            <Badge variant="secondary" className="text-xs">{sinrQuality.label}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <SaveCalculationDialog type="linkbudget" parameters={linkBudgetData.parameters} results={linkBudgetData.results} />
                        <Button variant="default" onClick={copyLinkBudgetResults} data-testid="button-copy-linkbudget">
                          <Copy className="w-4 h-4 mr-2" />Copiar Resultados
                        </Button>
                        <Button variant="secondary" onClick={exportLinkBudgetCSV} data-testid="button-export-linkbudget">
                          <Download className="w-4 h-4 mr-2" />Exportar CSV
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Modelos de perda 3GPP TR 38.901 assumem condições LOS/NLOS conforme indicado. FSPL assume linha de visada em espaço livre.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {/* ── Seção de Gráficos ── */}
            {activeSection === "charts" && (
              <div className="space-y-6">
                {/* Throughput vs Largura de Banda */}
                <Card>
                  <CardHeader>
                    <CardTitle>Throughput vs Largura de Banda</CardTitle>
                    <CardDescription>
                      Varredura de throughput DL nas larguras de banda padrão 5G NR com as configurações atuais de modulação e MIMO
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={throughputChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="bw" label={{ value: "Largura de Banda (MHz)", position: "insideBottom", offset: -2 }}
                            tick={{ fontSize: 11 }} />
                          <YAxis label={{ value: "Throughput (Mbps)", angle: -90, position: "insideLeft", offset: 10 }}
                            tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => [`${v} Mbps`, "Throughput"]} labelFormatter={(l) => `${l} MHz`} />
                          <Line type="monotone" dataKey="throughput" stroke="hsl(var(--primary))"
                            strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Throughput" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Configuração atual: {modulation}, {mimoLayers}×MIMO, {fddTdd}, DL={dlFraction.toFixed(2)}, overhead={signalingOverhead}
                    </p>
                  </CardContent>
                </Card>

                {/* Perda de Percurso vs Distância */}
                <Card>
                  <CardHeader>
                    <CardTitle>Perda de Percurso vs Distância</CardTitle>
                    <CardDescription>
                      Comparação de todos os modelos de propagação a {frequency} MHz
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={pathLossChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="d" label={{ value: "Distância (km)", position: "insideBottom", offset: -2 }}
                            tick={{ fontSize: 11 }} />
                          <YAxis label={{ value: "Perda de Percurso (dB)", angle: -90, position: "insideLeft", offset: 10 }}
                            tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                          <Tooltip formatter={(v) => [`${v} dB`]} labelFormatter={(l) => `${l} km`} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="FSPL" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="UMa LOS" stroke="#10b981" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="UMa NLOS" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                          <Line type="monotone" dataKey="UMi LOS" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="RMa LOS" stroke="#ec4899" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="Indoor" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Modelos baseados na Tabela 7.4.1 do 3GPP TR 38.901. Altere a frequência na aba Link Budget para atualizar este gráfico.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Barra Lateral — Histórico */}
          <div className="lg:col-span-1">
            <CalculationHistory type={activeSection === "calc" ? mode : undefined} onLoad={loadCalculation} />
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Calculadora 5G NR profissional para análise de engenharia de RF</p>
        </div>
      </div>
    </div>
  );
}
