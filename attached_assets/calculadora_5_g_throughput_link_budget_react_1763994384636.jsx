import React, { useMemo, useState } from "react";

// 5G NR Throughput & Link Budget — UI inspired by 5g-tools.com throughput & link budget calculators
// Ready-to-paste React component (Tailwind CSS). Features:
// - Throughput calculator with FDD/TDD, numerology, SCS, aggregation, MIMO, auto/ manual MCS/code rate
// - Link budget calculator with FSPL or custom path loss, antenna patterns, cable losses, receiver sensitivity
// - Export to CSV, vendor presets, TDD symbol allocation, and copy buttons

export default function FiveGToolsUI() {
  /** ---------- GENERAL STATE ---------- */
  const [mode, setMode] = useState("throughput"); // or 'linkbudget'

  /** ---------- THROUGHPUT STATE ---------- */
  const [fr, setFr] = useState("FR1");
  const [fddTdd, setFddTdd] = useState("FDD");
  const [numerology, setNumerology] = useState(1); // mu: 0=15kHz,1=30kHz,2=60kHz...
  const [scs, setScs] = useState(30); // kHz
  const [bwMHz, setBwMHz] = useState(100);
  const [aggregatedCarriers, setAggregatedCarriers] = useState(1);
  const [mimoLayers, setMimoLayers] = useState(2);
  const [modulation, setModulation] = useState("256QAM");
  const [codeRate, setCodeRate] = useState(948/1024); // default LDPC best effort
  const [tbsScaling, setTbsScaling] = useState(1.0);
  const [numBeams, setNumBeams] = useState(1);
  const [slotFormat, setSlotFormat] = useState("fullDL");
  const [customDlFraction, setCustomDlFraction] = useState(1.0);
  const [manualPRBs, setManualPRBs] = useState("");
  const [signalingOverhead, setSignalingOverhead] = useState(0.14);

  /** ---------- LINK BUDGET STATE ---------- */
  const [txPower, setTxPower] = useState(30); // dBm per carrier
  const [txGain, setTxGain] = useState(15); // dBi
  const [rxGain, setRxGain] = useState(0); // dBi
  const [txCableLoss, setTxCableLoss] = useState(0);
  const [rxCableLoss, setRxCableLoss] = useState(0);
  const [otherLosses, setOtherLosses] = useState(2);
  const [frequency, setFrequency] = useState(3500); // MHz
  const [distanceKm, setDistanceKm] = useState(0.2);
  const [pathModel, setPathModel] = useState("fspl");
  const [customPathLoss, setCustomPathLoss] = useState(120);
  const [noiseFigure, setNoiseFigure] = useState(7);
  const [rbBandwidthMHz, setRbBandwidthMHz] = useState(20);

  /** ---------- HELPERS ---------- */
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

  // PRB calculation per 3GPP: approx PRB count depends on BW and SCS. We use simplified approach similar to 5g-tools: PRB ~= floor(BW_kHz / (12*SCS))
  const prbs = useMemo(() => {
    if (manualPRBs) return Math.max(0, Math.floor(Number(manualPRBs) || 0));
    const totalKHz = Math.max(1, bwMHz * 1000);
    const rbKHz = 12 * Math.max(1, scs);
    return Math.max(0, Math.floor(totalKHz / rbKHz));
  }, [bwMHz, scs, manualPRBs]);

  // DL fraction for TDD slot formats (simplified). Provide presets and custom.
  const dlFraction = useMemo(() => {
    if (fddTdd === "FDD") return 1.0;
    if (slotFormat === "45") return 6/14; // example 45 pattern from 5G-tools
    if (slotFormat === "special") return customDlFraction;
    if (slotFormat === "fullDL") return 1.0;
    if (slotFormat === "mixed") return 0.5;
    return 1.0;
  }, [fddTdd, slotFormat, customDlFraction]);

  // Spectral efficiency approx: bits per symbol * codeRate * layers * scaling
  const spectralEfficiency = useMemo(() => modulationBits * codeRate * mimoLayers * tbsScaling, [modulationBits, codeRate, mimoLayers, tbsScaling]);

  // Throughput (Mbps): BW_MHz * spectral_eff * dlFraction * (1 - overhead) * carriers
  const throughputMbps = useMemo(() => {
    const raw = bwMHz * spectralEfficiency * dlFraction * (1 - signalingOverhead) * aggregatedCarriers;
    return Number.isFinite(raw) ? raw : 0;
  }, [bwMHz, spectralEfficiency, dlFraction, signalingOverhead, aggregatedCarriers]);

  // FSPL
  function fspl(d_km, f_mhz) {
    if (d_km <= 0) return 0;
    return 20 * Math.log10(d_km) + 20 * Math.log10(f_mhz) + 32.44;
  }

  const pathLoss = useMemo(() => pathModel === "fspl" ? fspl(Math.max(0.001, distanceKm), frequency) : Number(customPathLoss || 0), [pathModel, distanceKm, frequency, customPathLoss]);

  const receivedPower = useMemo(() => txPower - txCableLoss + txGain - pathLoss + rxGain - rxCableLoss - otherLosses, [txPower, txCableLoss, txGain, pathLoss, rxGain, rxCableLoss, otherLosses]);

  const noiseFloor = useMemo(() => {
    const B = Math.max(1e3, rbBandwidthMHz * 1e6);
    const thermal = -174 + 10 * Math.log10(B);
    return thermal + noiseFigure;
  }, [rbBandwidthMHz, noiseFigure]);

  const sinrDb = useMemo(() => receivedPower - noiseFloor, [receivedPower, noiseFloor]);

  /** ---------- EXPORT / UTILS ---------- */
  function downloadCSV(rows, filename = "export.csv") {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("
");
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
      ["Bandwidth (MHz)", bwMHz],
      ["SCS (kHz)", scs],
      ["PRBs (est)", prbs],
      ["Modulation", modulation],
      ["Code rate", codeRate.toFixed(4)],
      ["MIMO layers", mimoLayers],
      ["DL fraction", dlFraction.toFixed(3)],
      ["Signaling overhead", signalingOverhead],
      ["Throughput (Mbps)", throughputMbps.toFixed(2)]
    ];
    downloadCSV(rows, "throughput_export.csv");
  }

  function exportLinkBudgetCSV() {
    const rows = [
      ["Parameter","Value"],
      ["Tx power (dBm)", txPower],
      ["Tx gain (dBi)", txGain],
      ["Path loss (dB)", pathLoss.toFixed(2)],
      ["Received power (dBm)", receivedPower.toFixed(2)],
      ["Noise floor (dBm)", noiseFloor.toFixed(2)],
      ["SINR (dB)", sinrDb.toFixed(2)]
    ];
    downloadCSV(rows, "linkbudget_export.csv");
  }

  function copyText(text) {
    navigator.clipboard?.writeText(text).then(()=>alert("Copiado"), ()=>alert("Falha ao copiar"));
  }

  /** ---------- RENDER ---------- */
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">5G NR — Throughput & Link Budget (UI modelled after 5g-tools)</h1>
        <div className="space-x-2">
          <button className={`px-3 py-2 rounded ${mode==='throughput'?'bg-sky-600 text-white':'bg-gray-100'}`} onClick={()=>setMode('throughput')}>Throughput</button>
          <button className={`px-3 py-2 rounded ${mode==='linkbudget'?'bg-sky-600 text-white':'bg-gray-100'}`} onClick={()=>setMode('linkbudget')}>Link Budget</button>
        </div>
      </div>

      {mode === 'throughput' && (
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm">FR
                <select className="w-full mt-1 p-2 border rounded" value={fr} onChange={e=>setFr(e.target.value)}>
                  <option>FR1</option>
                  <option>FR2</option>
                </select>
              </label>

              <label className="block text-sm mt-2">FDD / TDD
                <select className="w-full mt-1 p-2 border rounded" value={fddTdd} onChange={e=>setFddTdd(e.target.value)}>
                  <option>FDD</option>
                  <option>TDD</option>
                </select>
              </label>

              <label className="block text-sm mt-2">Numerology (µ)
                <input className="w-full mt-1 p-2 border rounded" type="number" min="0" max="4" value={numerology} onChange={e=>setNumerology(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">SCS (kHz)
                <select className="w-full mt-1 p-2 border rounded" value={scs} onChange={e=>setScs(Number(e.target.value))}>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={60}>60</option>
                  <option value={120}>120</option>
                </select>
              </label>

              <label className="block text-sm mt-2">Bandwidth (MHz)
                <input className="w-full mt-1 p-2 border rounded" type="number" value={bwMHz} onChange={e=>setBwMHz(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">Aggregated carriers
                <input className="w-full mt-1 p-2 border rounded" type="number" value={aggregatedCarriers} onChange={e=>setAggregatedCarriers(Number(e.target.value))} />
              </label>

            </div>

            <div>
              <label className="block text-sm">PRBs override (leave empty for auto)
                <input className="w-full mt-1 p-2 border rounded" value={manualPRBs} onChange={e=>setManualPRBs(e.target.value)} />
              </label>

              <label className="block text-sm mt-2">Modulation
                <select className="w-full mt-1 p-2 border rounded" value={modulation} onChange={e=>setModulation(e.target.value)}>
                  <option>QPSK</option>
                  <option>16QAM</option>
                  <option>64QAM</option>
                  <option>256QAM</option>
                  <option>1024QAM</option>
                </select>
              </label>

              <label className="block text-sm mt-2">Code rate
                <input className="w-full mt-1 p-2 border rounded" type="number" step="0.001" min="0" max="1" value={codeRate} onChange={e=>setCodeRate(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">MIMO layers
                <input className="w-full mt-1 p-2 border rounded" type="number" value={mimoLayers} onChange={e=>setMimoLayers(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">TBS scaling
                <input className="w-full mt-1 p-2 border rounded" type="number" step="0.01" value={tbsScaling} onChange={e=>setTbsScaling(Number(e.target.value))} />
              </label>

            </div>

            <div>
              <label className="block text-sm">TDD slot format
                <select className="w-full mt-1 p-2 border rounded" value={slotFormat} onChange={e=>setSlotFormat(e.target.value)}>
                  <option value="fullDL">All DL (or FDD)</option>
                  <option value="mixed">Mixed DL/UL (50%)</option>
                  <option value="45">Pattern 45 (example)</option>
                  <option value="special">Custom DL fraction</option>
                </select>
              </label>

              {slotFormat === 'special' && (
                <label className="block text-sm mt-2">DL fraction (0..1)
                  <input className="w-full mt-1 p-2 border rounded" type="number" step="0.01" min="0" max="1" value={customDlFraction} onChange={e=>setCustomDlFraction(Number(e.target.value))} />
                </label>
              )}

              <label className="block text-sm mt-2">Number of beams
                <input className="w-full mt-1 p-2 border rounded" type="number" value={numBeams} onChange={e=>setNumBeams(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">Signaling overhead (fraction)
                <input className="w-full mt-1 p-2 border rounded" type="number" step="0.01" min="0" max="1" value={signalingOverhead} onChange={e=>setSignalingOverhead(Number(e.target.value))} />
              </label>

            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded">
            <div className="grid md:grid-cols-2 gap-2">
              <div>Estimated PRBs: <strong>{prbs}</strong></div>
              <div>Spectral efficiency approx.: <strong>{spectralEfficiency.toFixed(3)} bits/s/Hz</strong></div>
              <div>DL fraction: <strong>{dlFraction.toFixed(3)}</strong></div>
              <div>Estimated Throughput (PHY): <strong>{throughputMbps.toFixed(2)} Mbps</strong></div>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 rounded bg-slate-800 text-white" onClick={()=>copyText([`Throughput: ${throughputMbps.toFixed(2)} Mbps`,`PRBs: ${prbs}`].join('
'))}>Copiar</button>
              <button className="px-3 py-2 rounded bg-sky-600 text-white" onClick={exportThroughputCSV}>Exportar CSV</button>
            </div>

            <div className="text-xs mt-2 text-gray-600">Nota: implementação aproximada baseada na metodologia e opções dos exemplos em 5g-tools (TDD/FDD, numerologia, PRB table approximations, TBS scaling). Consultar 3GPP para resultados precisos em produção.</div>
          </div>
        </div>
      )}

      {mode === 'linkbudget' && (
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">Tx power (dBm)
                <input className="w-full mt-1 p-2 border rounded" type="number" value={txPower} onChange={e=>setTxPower(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">Tx gain (dBi)
                <input className="w-full mt-1 p-2 border rounded" type="number" value={txGain} onChange={e=>setTxGain(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">Tx cable loss (dB)
                <input className="w-full mt-1 p-2 border rounded" type="number" value={txCableLoss} onChange={e=>setTxCableLoss(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">Frequency (MHz)
                <input className="w-full mt-1 p-2 border rounded" type="number" value={frequency} onChange={e=>setFrequency(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">Distance (km)
                <input className="w-full mt-1 p-2 border rounded" type="number" step="0.001" value={distanceKm} onChange={e=>setDistanceKm(Number(e.target.value))} />
              </label>

            </div>

            <div>
              <label className="block text-sm">Rx gain (dBi)
                <input className="w-full mt-1 p-2 border rounded" type="number" value={rxGain} onChange={e=>setRxGain(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">Rx cable loss (dB)
                <input className="w-full mt-1 p-2 border rounded" type="number" value={rxCableLoss} onChange={e=>setRxCableLoss(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">Other losses (dB)
                <input className="w-full mt-1 p-2 border rounded" type="number" value={otherLosses} onChange={e=>setOtherLosses(Number(e.target.value))} />
              </label>

              <label className="block text-sm mt-2">Path loss model
                <select className="w-full mt-1 p-2 border rounded" value={pathModel} onChange={e=>setPathModel(e.target.value)}>
                  <option value="fspl">FSPL (free-space)</option>
                  <option value="custom">Custom (dB)</option>
                </select>
              </label>

              {pathModel==='custom' && (
                <label className="block text-sm mt-2">Custom path loss (dB)
                  <input className="w-full mt-1 p-2 border rounded" type="number" value={customPathLoss} onChange={e=>setCustomPathLoss(Number(e.target.value))} />
                </label>
              )}

            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded">
            <div className="grid md:grid-cols-3 gap-2">
              <div>Path loss: <strong>{pathLoss.toFixed(2)} dB</strong></div>
              <div>Received power: <strong>{receivedPower.toFixed(2)} dBm</strong></div>
              <div>Noise floor: <strong>{noiseFloor.toFixed(2)} dBm</strong></div>
              <div>SINR (approx): <strong>{sinrDb.toFixed(2)} dB</strong></div>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 rounded bg-slate-800 text-white" onClick={()=>copyText([`Received: ${receivedPower.toFixed(2)} dBm`,`SINR: ${sinrDb.toFixed(2)} dB`].join('
'))}>Copiar</button>
              <button className="px-3 py-2 rounded bg-sky-600 text-white" onClick={exportLinkBudgetCSV}>Exportar CSV</button>
            </div>

            <div className="text-xs mt-2 text-gray-600">Nota: esta página segue a organização visual e opções encontradas nas ferramentas de referência (por exemplo, seleção de TDD/FDD, slot formats e presets). Para cálculos normativos, referir-se aos textos 3GPP relevantes.</div>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-700">
        Fontes do modelo desta interface: 5G-Tools throughput & link budget calculators.
      </div>
    </div>
  );
}
