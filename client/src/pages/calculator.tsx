import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Calculator() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"throughput" | "linkbudget">("throughput");

  // Throughput state
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

  // Link budget state
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

  // Throughput calculations
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
    if (slotFormat === "mixed") return 0.5;
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

  // Link budget calculations
  function fspl(d_km: number, f_mhz: number) {
    if (d_km <= 0) return 0;
    return 20 * Math.log10(d_km) + 20 * Math.log10(f_mhz) + 32.44;
  }

  const pathLoss = useMemo(
    () => (pathModel === "fspl" ? fspl(Math.max(0.001, distanceKm), frequency) : Number(customPathLoss || 0)),
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

  // Export functions
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
    const rows = [
      ["Parameter", "Value"],
      ["Frequency Range", fr],
      ["Duplex Mode", fddTdd],
      ["Numerology", numerology],
      ["Subcarrier Spacing (kHz)", scs],
      ["Bandwidth (MHz)", bwMHz],
      ["Aggregated Carriers", aggregatedCarriers],
      ["PRBs (estimated)", prbs],
      ["Modulation", modulation],
      ["Code Rate", codeRate.toFixed(4)],
      ["MIMO Layers", mimoLayers],
      ["TBS Scaling", tbsScaling],
      ["DL Fraction", dlFraction.toFixed(3)],
      ["Signaling Overhead", signalingOverhead],
      ["Spectral Efficiency (bits/s/Hz)", spectralEfficiency.toFixed(3)],
      ["Throughput (Mbps)", throughputMbps.toFixed(2)],
    ];
    downloadCSV(rows, "5g-throughput-export.csv");
    toast({
      title: "Export successful",
      description: "Throughput data exported to CSV",
    });
  }

  function exportLinkBudgetCSV() {
    const rows = [
      ["Parameter", "Value"],
      ["Tx Power (dBm)", txPower],
      ["Tx Gain (dBi)", txGain],
      ["Tx Cable Loss (dB)", txCableLoss],
      ["Rx Gain (dBi)", rxGain],
      ["Rx Cable Loss (dB)", rxCableLoss],
      ["Other Losses (dB)", otherLosses],
      ["Frequency (MHz)", frequency],
      ["Distance (km)", distanceKm],
      ["Path Loss Model", pathModel.toUpperCase()],
      ["Path Loss (dB)", pathLoss.toFixed(2)],
      ["Received Power (dBm)", receivedPower.toFixed(2)],
      ["Noise Figure (dB)", noiseFigure],
      ["Receiver Bandwidth (MHz)", rbBandwidthMHz],
      ["Noise Floor (dBm)", noiseFloor.toFixed(2)],
      ["SINR (dB)", sinrDb.toFixed(2)],
    ];
    downloadCSV(rows, "5g-linkbudget-export.csv");
    toast({
      title: "Export successful",
      description: "Link budget data exported to CSV",
    });
  }

  function copyThroughputResults() {
    const text = `5G NR Throughput Results
Throughput: ${throughputMbps.toFixed(2)} Mbps
PRBs: ${prbs}
Spectral Efficiency: ${spectralEfficiency.toFixed(3)} bits/s/Hz
DL Fraction: ${dlFraction.toFixed(3)}`;
    
    navigator.clipboard?.writeText(text).then(
      () => toast({ title: "Copied to clipboard", description: "Results copied successfully" }),
      () => toast({ title: "Copy failed", description: "Could not copy to clipboard", variant: "destructive" })
    );
  }

  function copyLinkBudgetResults() {
    const text = `5G NR Link Budget Results
Received Power: ${receivedPower.toFixed(2)} dBm
Path Loss: ${pathLoss.toFixed(2)} dB
Noise Floor: ${noiseFloor.toFixed(2)} dBm
SINR: ${sinrDb.toFixed(2)} dB`;
    
    navigator.clipboard?.writeText(text).then(
      () => toast({ title: "Copied to clipboard", description: "Results copied successfully" }),
      () => toast({ title: "Copy failed", description: "Could not copy to clipboard", variant: "destructive" })
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            5G NR Calculator
          </h1>
          <p className="text-sm text-muted-foreground">
            Professional throughput and link budget analysis tool for RF engineers
          </p>
        </div>

        {/* Mode Switcher */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "throughput" | "linkbudget")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6" data-testid="tabs-mode-switcher">
            <TabsTrigger value="throughput" data-testid="tab-throughput">
              Throughput
            </TabsTrigger>
            <TabsTrigger value="linkbudget" data-testid="tab-linkbudget">
              Link Budget
            </TabsTrigger>
          </TabsList>

          {/* Throughput Calculator */}
          <TabsContent value="throughput" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Throughput Parameters</CardTitle>
                <CardDescription>
                  Configure 5G NR physical layer parameters for throughput calculation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Column 1: RF Parameters */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fr">Frequency Range</Label>
                      <Select value={fr} onValueChange={setFr}>
                        <SelectTrigger id="fr" data-testid="select-fr">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FR1">FR1 (Sub-6 GHz)</SelectItem>
                          <SelectItem value="FR2">FR2 (mmWave)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fddtdd">Duplex Mode</Label>
                      <Select value={fddTdd} onValueChange={setFddTdd}>
                        <SelectTrigger id="fddtdd" data-testid="select-duplex">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FDD">FDD</SelectItem>
                          <SelectItem value="TDD">TDD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numerology">Numerology (μ)</Label>
                      <Input
                        id="numerology"
                        type="number"
                        min="0"
                        max="4"
                        value={numerology}
                        onChange={(e) => setNumerology(Number(e.target.value))}
                        data-testid="input-numerology"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scs">Subcarrier Spacing (kHz)</Label>
                      <Select value={String(scs)} onValueChange={(v) => setScs(Number(v))}>
                        <SelectTrigger id="scs" data-testid="select-scs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="60">60</SelectItem>
                          <SelectItem value="120">120</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bandwidth">Bandwidth (MHz)</Label>
                      <Input
                        id="bandwidth"
                        type="number"
                        value={bwMHz}
                        onChange={(e) => setBwMHz(Number(e.target.value))}
                        data-testid="input-bandwidth"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="carriers">Aggregated Carriers</Label>
                      <Input
                        id="carriers"
                        type="number"
                        min="1"
                        value={aggregatedCarriers}
                        onChange={(e) => setAggregatedCarriers(Number(e.target.value))}
                        data-testid="input-carriers"
                      />
                    </div>
                  </div>

                  {/* Column 2: Modulation Parameters */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="prbs">PRBs (leave empty for auto)</Label>
                      <Input
                        id="prbs"
                        type="text"
                        placeholder="Auto-calculated"
                        value={manualPRBs}
                        onChange={(e) => setManualPRBs(e.target.value)}
                        data-testid="input-prbs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modulation">Modulation</Label>
                      <Select value={modulation} onValueChange={setModulation}>
                        <SelectTrigger id="modulation" data-testid="select-modulation">
                          <SelectValue />
                        </SelectTrigger>
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
                      <Label htmlFor="coderate">Code Rate</Label>
                      <Input
                        id="coderate"
                        type="number"
                        step="0.001"
                        min="0"
                        max="1"
                        value={codeRate}
                        onChange={(e) => setCodeRate(Number(e.target.value))}
                        data-testid="input-coderate"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mimo">MIMO Layers</Label>
                      <Input
                        id="mimo"
                        type="number"
                        min="1"
                        value={mimoLayers}
                        onChange={(e) => setMimoLayers(Number(e.target.value))}
                        data-testid="input-mimo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tbsscaling">TBS Scaling</Label>
                      <Input
                        id="tbsscaling"
                        type="number"
                        step="0.01"
                        value={tbsScaling}
                        onChange={(e) => setTbsScaling(Number(e.target.value))}
                        data-testid="input-tbs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="beams">Number of Beams</Label>
                      <Input
                        id="beams"
                        type="number"
                        min="1"
                        value={numBeams}
                        onChange={(e) => setNumBeams(Number(e.target.value))}
                        data-testid="input-beams"
                      />
                    </div>
                  </div>

                  {/* Column 3: TDD Parameters */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="slotformat">TDD Slot Format</Label>
                      <Select value={slotFormat} onValueChange={setSlotFormat}>
                        <SelectTrigger id="slotformat" data-testid="select-slotformat">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fullDL">All DL (or FDD)</SelectItem>
                          <SelectItem value="mixed">Mixed DL/UL (50%)</SelectItem>
                          <SelectItem value="45">Pattern 45</SelectItem>
                          <SelectItem value="special">Custom DL Fraction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {slotFormat === "special" && (
                      <div className="space-y-2">
                        <Label htmlFor="dlfraction">DL Fraction (0-1)</Label>
                        <Input
                          id="dlfraction"
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={customDlFraction}
                          onChange={(e) => setCustomDlFraction(Number(e.target.value))}
                          data-testid="input-dlfraction"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="overhead">Signaling Overhead</Label>
                      <Input
                        id="overhead"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={signalingOverhead}
                        onChange={(e) => setSignalingOverhead(Number(e.target.value))}
                        data-testid="input-overhead"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Throughput Results */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Calculated throughput and intermediate values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Estimated PRBs</div>
                    <div className="text-2xl font-mono font-semibold" data-testid="result-prbs">
                      {prbs}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Spectral Efficiency</div>
                    <div className="text-2xl font-mono font-semibold" data-testid="result-spectral">
                      {spectralEfficiency.toFixed(3)}
                    </div>
                    <div className="text-xs text-muted-foreground">bits/s/Hz</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">DL Fraction</div>
                    <div className="text-2xl font-mono font-semibold" data-testid="result-dlfraction">
                      {dlFraction.toFixed(3)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Throughput (PHY)</div>
                    <div className="text-2xl font-mono font-semibold text-primary" data-testid="result-throughput">
                      {throughputMbps.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Mbps</div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="default"
                    onClick={copyThroughputResults}
                    data-testid="button-copy-throughput"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Results
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={exportThroughputCSV}
                    data-testid="button-export-throughput"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Note: Approximate implementation based on 3GPP methodology. Values include PRB estimation,
                  TDD/FDD configurations, and TBS scaling. Consult 3GPP specifications for production calculations.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Link Budget Calculator */}
          <TabsContent value="linkbudget" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Link Budget Parameters</CardTitle>
                <CardDescription>
                  Configure transmitter, receiver, and propagation parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Transmitter */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Transmitter</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="txpower">Tx Power (dBm)</Label>
                      <Input
                        id="txpower"
                        type="number"
                        value={txPower}
                        onChange={(e) => setTxPower(Number(e.target.value))}
                        data-testid="input-txpower"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="txgain">Tx Gain (dBi)</Label>
                      <Input
                        id="txgain"
                        type="number"
                        value={txGain}
                        onChange={(e) => setTxGain(Number(e.target.value))}
                        data-testid="input-txgain"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="txcableloss">Tx Cable Loss (dB)</Label>
                      <Input
                        id="txcableloss"
                        type="number"
                        value={txCableLoss}
                        onChange={(e) => setTxCableLoss(Number(e.target.value))}
                        data-testid="input-txcableloss"
                      />
                    </div>

                    <h3 className="text-sm font-medium text-muted-foreground pt-4">Propagation</h3>

                    <div className="space-y-2">
                      <Label htmlFor="freq">Frequency (MHz)</Label>
                      <Input
                        id="freq"
                        type="number"
                        value={frequency}
                        onChange={(e) => setFrequency(Number(e.target.value))}
                        data-testid="input-frequency"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="distance">Distance (km)</Label>
                      <Input
                        id="distance"
                        type="number"
                        step="0.001"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Number(e.target.value))}
                        data-testid="input-distance"
                      />
                    </div>
                  </div>

                  {/* Column 2: Receiver */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Receiver</h3>

                    <div className="space-y-2">
                      <Label htmlFor="rxgain">Rx Gain (dBi)</Label>
                      <Input
                        id="rxgain"
                        type="number"
                        value={rxGain}
                        onChange={(e) => setRxGain(Number(e.target.value))}
                        data-testid="input-rxgain"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rxcableloss">Rx Cable Loss (dB)</Label>
                      <Input
                        id="rxcableloss"
                        type="number"
                        value={rxCableLoss}
                        onChange={(e) => setRxCableLoss(Number(e.target.value))}
                        data-testid="input-rxcableloss"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otherloss">Other Losses (dB)</Label>
                      <Input
                        id="otherloss"
                        type="number"
                        value={otherLosses}
                        onChange={(e) => setOtherLosses(Number(e.target.value))}
                        data-testid="input-otherloss"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="noisefig">Noise Figure (dB)</Label>
                      <Input
                        id="noisefig"
                        type="number"
                        value={noiseFigure}
                        onChange={(e) => setNoiseFigure(Number(e.target.value))}
                        data-testid="input-noisefig"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rxbandwidth">Receiver Bandwidth (MHz)</Label>
                      <Input
                        id="rxbandwidth"
                        type="number"
                        value={rbBandwidthMHz}
                        onChange={(e) => setRbBandwidthMHz(Number(e.target.value))}
                        data-testid="input-rxbandwidth"
                      />
                    </div>

                    <h3 className="text-sm font-medium text-muted-foreground pt-4">Path Loss Model</h3>

                    <div className="space-y-2">
                      <Label htmlFor="pathmodel">Model</Label>
                      <Select value={pathModel} onValueChange={setPathModel}>
                        <SelectTrigger id="pathmodel" data-testid="select-pathmodel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fspl">FSPL (Free Space)</SelectItem>
                          <SelectItem value="custom">Custom Path Loss</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {pathModel === "custom" && (
                      <div className="space-y-2">
                        <Label htmlFor="custompathloss">Custom Path Loss (dB)</Label>
                        <Input
                          id="custompathloss"
                          type="number"
                          value={customPathLoss}
                          onChange={(e) => setCustomPathLoss(Number(e.target.value))}
                          data-testid="input-custompathloss"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Link Budget Results */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Calculated link budget and signal quality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Path Loss</div>
                    <div className="text-2xl font-mono font-semibold" data-testid="result-pathloss">
                      {pathLoss.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">dB</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Received Power</div>
                    <div className="text-2xl font-mono font-semibold text-primary" data-testid="result-rxpower">
                      {receivedPower.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">dBm</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Noise Floor</div>
                    <div className="text-2xl font-mono font-semibold" data-testid="result-noisefloor">
                      {noiseFloor.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">dBm</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">SINR</div>
                    <div className="text-2xl font-mono font-semibold text-primary" data-testid="result-sinr">
                      {sinrDb.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">dB</div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="default"
                    onClick={copyLinkBudgetResults}
                    data-testid="button-copy-linkbudget"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Results
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={exportLinkBudgetCSV}
                    data-testid="button-export-linkbudget"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Note: Link budget calculation includes transmit power, antenna gains, cable losses, and propagation
                  path loss. FSPL model assumes free-space line-of-sight conditions. For more accurate predictions,
                  use site-specific propagation models.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Professional 5G NR calculator for RF engineering analysis</p>
          <p className="mt-1">UI design inspired by 5G-Tools.com methodology</p>
        </div>
      </div>
    </div>
  );
}
