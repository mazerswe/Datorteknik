/**
 * Datorteknik Datapath Simulator
 * Interactive CPU datapath with definable micro-operations
 */

class DatapathSimulator {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    this.options = {
      clockSpeed: 1000, // ms per cycle
      maxMemory: 256,
      registerCount: 8,
      ...options
    };
    
    this.state = {
      registers: new Array(this.options.registerCount).fill(0),
      pc: 0,
      ir: 0,
      mar: 0,
      mdr: 0,
      flags: { z: 0, n: 0, c: 0, v: 0 },
      memory: new Array(this.options.maxMemory).fill(0),
      busA: 0,
      busB: 0,
      aluResult: 0,
      aluFlags: { z: 0, n: 0, c: 0, v: 0 }
    };
    
    this.microProgram = [];
    this.currentStep = 0;
    this.running = false;
    this.intervalId = null;
    this.executionTrace = [];
    
    this.presets = {
      'fetch-decode-execute': {
        name: 'Fetch-Decode-Execute Cycle',
        description: 'Basic instruction fetch and decode sequence',
        microOps: [
          'MAR ← PC',
          'MDR ← Mem[MAR]',
          'IR ← MDR',
          'PC ← PC + 1'
        ]
      },
      'load-store': {
        name: 'Load/Store Operations',
        description: 'Memory load and store operations',
        microOps: [
          'MAR ← R[1]',
          'MDR ← Mem[MAR]',
          'R[0] ← MDR',
          'MAR ← R[2]',
          'MDR ← R[0]',
          'Mem[MAR] ← MDR'
        ]
      },
      'alu-operations': {
        name: 'ALU Operations',
        description: 'Arithmetic and logic operations',
        microOps: [
          'A ← R[0]',
          'B ← R[1]',
          'ALU ← A + B',
          'R[2] ← ALU',
          'FLAGS ← ALU.flags'
        ]
      }
    };
    
    this.init();
  }
  
  init() {
    if (!this.container) {
      console.error('Datapath simulator container not found');
      return;
    }
    
    this.container.className = 'datapath-simulator';
    this.container.setAttribute('role', 'application');
    this.container.setAttribute('aria-label', 'CPU Datapath Simulator');
    
    this.render();
    this.bindEvents();
    
    // Initialize with default preset
    this.loadPreset('fetch-decode-execute');
  }
  
  render() {
    this.container.innerHTML = `
      <div class="simulator-header">
        <h3>CPU Datapath Simulator</h3>
        <div class="simulator-controls">
          ${this.renderControls()}
        </div>
      </div>
      
      <div class="simulator-content">
        <div class="datapath-diagram">
          ${this.renderDatapathSVG()}
        </div>
        
        <div class="simulator-panels">
          <div class="panel">
            <h4>Micro-operations</h4>
            ${this.renderMicroOpsEditor()}
          </div>
          
          <div class="panel">
            <h4>State</h4>
            ${this.renderState()}
          </div>
          
          <div class="panel">
            <h4>Execution Trace</h4>
            ${this.renderTrace()}
          </div>
        </div>
      </div>
    `;
    
    this.updateHighlights();
  }
  
  renderControls() {
    return `
      <div class="control-group">
        <button class="btn ${this.running ? 'secondary' : ''}" onclick="datapathSim.toggleRunning()">
          ${this.running ? 'Pause' : 'Run'}
        </button>
        <button class="btn secondary" onclick="datapathSim.step()">Step</button>
        <button class="btn secondary" onclick="datapathSim.reset()">Reset</button>
      </div>
      
      <div class="control-group">
        <label for="clock-speed">Clock Speed:</label>
        <input type="range" id="clock-speed" min="100" max="3000" value="${this.options.clockSpeed}"
               oninput="datapathSim.setClockSpeed(this.value)">
        <span>${this.options.clockSpeed}ms</span>
      </div>
      
      <div class="control-group">
        <label for="preset-select">Presets:</label>
        <select id="preset-select" onchange="datapathSim.loadPreset(this.value)">
          ${Object.keys(this.presets).map(key => 
            `<option value="${key}">${this.presets[key].name}</option>`
          ).join('')}
        </select>
        <button class="btn secondary" onclick="datapathSim.showImportExport()">Import/Export</button>
      </div>
    `;
  }
  
  renderDatapathSVG() {
    return `
      <svg width="800" height="600" viewBox="0 0 800 600" class="datapath-svg">
        <!-- Memory -->
        <rect id="memory" x="50" y="50" width="80" height="120" rx="5" 
              class="component" stroke="#333" stroke-width="2" fill="#f0f0f0"/>
        <text x="90" y="110" text-anchor="middle" class="component-label">Memory</text>
        
        <!-- MAR -->
        <rect id="mar" x="180" y="70" width="60" height="30" rx="3"
              class="component register" stroke="#333" stroke-width="1" fill="#e0e0e0"/>
        <text x="210" y="88" text-anchor="middle" class="register-label">MAR</text>
        <text x="210" y="102" text-anchor="middle" class="register-value">${this.state.mar}</text>
        
        <!-- MDR -->
        <rect id="mdr" x="180" y="120" width="60" height="30" rx="3"
              class="component register" stroke="#333" stroke-width="1" fill="#e0e0e0"/>
        <text x="210" y="138" text-anchor="middle" class="register-label">MDR</text>
        <text x="210" y="152" text-anchor="middle" class="register-value">${this.state.mdr}</text>
        
        <!-- IR -->
        <rect id="ir" x="300" y="70" width="80" height="30" rx="3"
              class="component register" stroke="#333" stroke-width="1" fill="#e0e0e0"/>
        <text x="340" y="88" text-anchor="middle" class="register-label">IR</text>
        <text x="340" y="102" text-anchor="middle" class="register-value">${this.state.ir}</text>
        
        <!-- PC -->
        <rect id="pc" x="420" y="70" width="60" height="30" rx="3"
              class="component register" stroke="#333" stroke-width="1" fill="#e0e0e0"/>
        <text x="450" y="88" text-anchor="middle" class="register-label">PC</text>
        <text x="450" y="102" text-anchor="middle" class="register-value">${this.state.pc}</text>
        
        <!-- Register File -->
        <rect id="register-file" x="520" y="50" width="120" height="200" rx="5"
              class="component" stroke="#333" stroke-width="2" fill="#f0f0f0"/>
        <text x="580" y="40" text-anchor="middle" class="component-label">Register File</text>
        ${this.state.registers.map((val, i) => `
          <rect id="reg-${i}" x="530" y="${70 + i * 20}" width="100" height="18" rx="2"
                class="register" stroke="#666" fill="#fff"/>
          <text x="535" y="${82 + i * 20}" class="register-label">R[${i}]</text>
          <text x="625" y="${82 + i * 20}" text-anchor="end" class="register-value">${val}</text>
        `).join('')}
        
        <!-- ALU -->
        <polygon id="alu" points="300,300 400,250 400,350" 
                 class="component alu" stroke="#333" stroke-width="2" fill="#ffe0e0"/>
        <text x="350" y="305" text-anchor="middle" class="component-label">ALU</text>
        
        <!-- ALU Inputs -->
        <rect id="bus-a" x="200" y="280" width="60" height="20" rx="3"
              class="component bus" stroke="#333" stroke-width="1" fill="#e0ffe0"/>
        <text x="230" y="293" text-anchor="middle" class="bus-label">Bus A: ${this.state.busA}</text>
        
        <rect id="bus-b" x="200" y="320" width="60" height="20" rx="3"
              class="component bus" stroke="#333" stroke-width="1" fill="#e0ffe0"/>
        <text x="230" y="333" text-anchor="middle" class="bus-label">Bus B: ${this.state.busB}</text>
        
        <!-- ALU Output -->
        <rect id="alu-result" x="420" y="295" width="80" height="20" rx="3"
              class="component bus" stroke="#333" stroke-width="1" fill="#ffe0e0"/>
        <text x="460" y="308" text-anchor="middle" class="bus-label">Result: ${this.state.aluResult}</text>
        
        <!-- Flags -->
        <rect id="flags" x="420" y="350" width="80" height="60" rx="3"
              class="component register" stroke="#333" stroke-width="1" fill="#e0e0e0"/>
        <text x="460" y="365" text-anchor="middle" class="register-label">FLAGS</text>
        <text x="430" y="380" class="flag-label">Z: ${this.state.flags.z}</text>
        <text x="470" y="380" class="flag-label">N: ${this.state.flags.n}</text>
        <text x="430" y="395" class="flag-label">C: ${this.state.flags.c}</text>
        <text x="470" y="395" class="flag-label">V: ${this.state.flags.v}</text>
        
        <!-- Buses/Connections -->
        <g class="connections" stroke="#666" stroke-width="2" fill="none">
          <!-- Memory to MAR/MDR -->
          <line id="mem-mar-line" x1="130" y1="85" x2="180" y2="85"/>
          <line id="mem-mdr-line" x1="130" y1="135" x2="180" y2="135"/>
          
          <!-- MDR to IR -->
          <line id="mdr-ir-line" x1="240" y1="135" x2="300" y2="85"/>
          
          <!-- PC connections -->
          <line id="pc-line" x1="450" y1="100" x2="450" y2="200"/>
          
          <!-- Register file to ALU -->
          <line id="reg-alu-a" x1="530" y1="290" x2="260" y2="290"/>
          <line id="reg-alu-b" x1="530" y1="330" x2="260" y2="330"/>
          
          <!-- ALU to register file -->
          <line id="alu-reg" x1="460" y1="305" x2="520" y2="160"/>
        </g>
      </svg>
    `;
  }
  
  renderMicroOpsEditor() {
    return `
      <div class="micro-ops-editor">
        <div class="current-program">
          <div class="program-info">
            <h5>${this.currentPreset ? this.presets[this.currentPreset].name : 'Custom Program'}</h5>
            <p class="small">${this.currentPreset ? this.presets[this.currentPreset].description : 'User-defined micro-operations'}</p>
          </div>
          
          <div class="micro-ops-list">
            ${this.microProgram.map((op, index) => `
              <div class="micro-op ${index === this.currentStep ? 'current' : ''} ${index < this.currentStep ? 'executed' : ''}">
                <span class="step-number">${index + 1}</span>
                <span class="operation">${op}</span>
                ${index === this.currentStep ? '<span class="current-indicator">→</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="editor-controls">
          <h5>Add Micro-operation</h5>
          <select id="micro-op-template">
            <option value="">Select template...</option>
            <option value="MAR ← PC">MAR ← PC</option>
            <option value="MDR ← Mem[MAR]">MDR ← Mem[MAR]</option>
            <option value="IR ← MDR">IR ← MDR</option>
            <option value="PC ← PC + 1">PC ← PC + 1</option>
            <option value="A ← R[0]">A ← R[0]</option>
            <option value="B ← R[1]">B ← R[1]</option>
            <option value="ALU ← A + B">ALU ← A + B</option>
            <option value="ALU ← A - B">ALU ← A - B</option>
            <option value="ALU ← A & B">ALU ← A & B</option>
            <option value="R[0] ← ALU">R[0] ← ALU</option>
            <option value="FLAGS ← ALU.flags">FLAGS ← ALU.flags</option>
            <option value="Mem[MAR] ← MDR">Mem[MAR] ← MDR</option>
          </select>
          <input type="text" id="custom-micro-op" placeholder="Or enter custom operation...">
          <button class="btn secondary" onclick="datapathSim.addMicroOp()">Add</button>
          <button class="btn secondary" onclick="datapathSim.clearProgram()">Clear All</button>
        </div>
      </div>
    `;
  }
  
  renderState() {
    return `
      <div class="state-display">
        <div class="state-section">
          <h5>Registers</h5>
          <div class="register-grid">
            ${this.state.registers.map((val, i) => `
              <div class="register-item">
                <label>R[${i}]:</label>
                <input type="number" value="${val}" min="0" max="255" 
                       onchange="datapathSim.updateRegister(${i}, this.value)">
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="state-section">
          <h5>Special Registers</h5>
          <div class="register-grid">
            <div class="register-item">
              <label>PC:</label>
              <input type="number" value="${this.state.pc}" min="0" max="255"
                     onchange="datapathSim.state.pc = parseInt(this.value); datapathSim.render();">
            </div>
            <div class="register-item">
              <label>IR:</label>
              <input type="number" value="${this.state.ir}" min="0" max="255"
                     onchange="datapathSim.state.ir = parseInt(this.value); datapathSim.render();">
            </div>
            <div class="register-item">
              <label>MAR:</label>
              <input type="number" value="${this.state.mar}" min="0" max="255"
                     onchange="datapathSim.state.mar = parseInt(this.value); datapathSim.render();">
            </div>
            <div class="register-item">
              <label>MDR:</label>
              <input type="number" value="${this.state.mdr}" min="0" max="255"
                     onchange="datapathSim.state.mdr = parseInt(this.value); datapathSim.render();">
            </div>
          </div>
        </div>
        
        <div class="state-section">
          <h5>Memory (first 16 locations)</h5>
          <div class="memory-grid">
            ${this.state.memory.slice(0, 16).map((val, addr) => `
              <div class="memory-item">
                <label>[${addr}]:</label>
                <input type="number" value="${val}" min="0" max="255"
                       onchange="datapathSim.state.memory[${addr}] = parseInt(this.value); datapathSim.render();">
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  renderTrace() {
    const recentTrace = this.executionTrace.slice(-10);
    return `
      <div class="execution-trace">
        ${recentTrace.length === 0 ? '<p class="small muted">No execution steps yet</p>' : ''}
        ${recentTrace.map((entry, index) => `
          <div class="trace-entry">
            <span class="trace-step">${entry.step}</span>
            <span class="trace-operation">${entry.operation}</span>
            <span class="trace-result">${entry.result}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  updateHighlights() {
    // Remove existing highlights
    this.container.querySelectorAll('.component').forEach(el => {
      el.classList.remove('active', 'source', 'destination');
    });
    
    if (this.currentStep < this.microProgram.length) {
      const operation = this.microProgram[this.currentStep];
      this.highlightOperation(operation);
    }
  }
  
  highlightOperation(operation) {
    const svg = this.container.querySelector('.datapath-svg');
    if (!svg) return;
    
    // Parse operation and highlight relevant components
    if (operation.includes('MAR ← PC')) {
      svg.querySelector('#pc')?.classList.add('source');
      svg.querySelector('#mar')?.classList.add('destination');
    } else if (operation.includes('MDR ← Mem[MAR]')) {
      svg.querySelector('#memory')?.classList.add('source');
      svg.querySelector('#mar')?.classList.add('active');
      svg.querySelector('#mdr')?.classList.add('destination');
    } else if (operation.includes('IR ← MDR')) {
      svg.querySelector('#mdr')?.classList.add('source');
      svg.querySelector('#ir')?.classList.add('destination');
    } else if (operation.includes('ALU ←')) {
      svg.querySelector('#alu')?.classList.add('active');
      svg.querySelector('#bus-a')?.classList.add('source');
      svg.querySelector('#bus-b')?.classList.add('source');
    } else if (operation.includes('← ALU')) {
      svg.querySelector('#alu')?.classList.add('source');
      svg.querySelector('#alu-result')?.classList.add('active');
    }
  }
  
  step() {
    if (this.currentStep >= this.microProgram.length) {
      this.currentStep = 0;
    }
    
    const operation = this.microProgram[this.currentStep];
    if (operation) {
      const result = this.executeMicroOp(operation);
      this.executionTrace.push({
        step: this.executionTrace.length + 1,
        operation: operation,
        result: result
      });
      
      this.currentStep++;
      this.render();
      this.announceToScreenReader(`Executed: ${operation}. ${result}`);
      
      if (this.currentStep >= this.microProgram.length) {
        this.running = false;
        this.announceToScreenReader('Program execution completed');
      }
    }
  }
  
  executeMicroOp(operation) {
    const op = operation.trim();
    
    try {
      if (op.match(/MAR\s*←\s*PC/i)) {
        this.state.mar = this.state.pc;
        return `MAR = ${this.state.mar}`;
        
      } else if (op.match(/MDR\s*←\s*Mem\[MAR\]/i)) {
        this.state.mdr = this.state.memory[this.state.mar] || 0;
        return `MDR = ${this.state.mdr}`;
        
      } else if (op.match(/IR\s*←\s*MDR/i)) {
        this.state.ir = this.state.mdr;
        return `IR = ${this.state.ir}`;
        
      } else if (op.match(/PC\s*←\s*PC\s*\+\s*1/i)) {
        this.state.pc = (this.state.pc + 1) % this.options.maxMemory;
        return `PC = ${this.state.pc}`;
        
      } else if (op.match(/A\s*←\s*R\[(\d+)\]/i)) {
        const regNum = parseInt(op.match(/R\[(\d+)\]/i)[1]);
        this.state.busA = this.state.registers[regNum] || 0;
        return `A = ${this.state.busA}`;
        
      } else if (op.match(/B\s*←\s*R\[(\d+)\]/i)) {
        const regNum = parseInt(op.match(/R\[(\d+)\]/i)[1]);
        this.state.busB = this.state.registers[regNum] || 0;
        return `B = ${this.state.busB}`;
        
      } else if (op.match(/ALU\s*←\s*A\s*\+\s*B/i)) {
        this.state.aluResult = (this.state.busA + this.state.busB) & 0xFF;
        this.updateALUFlags();
        return `ALU = ${this.state.aluResult}`;
        
      } else if (op.match(/ALU\s*←\s*A\s*-\s*B/i)) {
        this.state.aluResult = (this.state.busA - this.state.busB) & 0xFF;
        this.updateALUFlags();
        return `ALU = ${this.state.aluResult}`;
        
      } else if (op.match(/ALU\s*←\s*A\s*&\s*B/i)) {
        this.state.aluResult = this.state.busA & this.state.busB;
        this.updateALUFlags();
        return `ALU = ${this.state.aluResult}`;
        
      } else if (op.match(/R\[(\d+)\]\s*←\s*ALU/i)) {
        const regNum = parseInt(op.match(/R\[(\d+)\]/i)[1]);
        this.state.registers[regNum] = this.state.aluResult;
        return `R[${regNum}] = ${this.state.aluResult}`;
        
      } else if (op.match(/FLAGS\s*←\s*ALU\.flags/i)) {
        this.state.flags = { ...this.state.aluFlags };
        return `FLAGS updated`;
        
      } else if (op.match(/Mem\[MAR\]\s*←\s*MDR/i)) {
        this.state.memory[this.state.mar] = this.state.mdr;
        return `Mem[${this.state.mar}] = ${this.state.mdr}`;
        
      } else {
        return 'Unknown operation';
      }
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
  
  updateALUFlags() {
    this.state.aluFlags.z = this.state.aluResult === 0 ? 1 : 0;
    this.state.aluFlags.n = (this.state.aluResult & 0x80) ? 1 : 0;
    // Simplified carry/overflow flags
    this.state.aluFlags.c = this.state.aluResult > 255 ? 1 : 0;
    this.state.aluFlags.v = 0; // Simplified
  }
  
  toggleRunning() {
    this.running = !this.running;
    
    if (this.running) {
      this.intervalId = setInterval(() => {
        this.step();
        if (!this.running) {
          clearInterval(this.intervalId);
        }
      }, this.options.clockSpeed);
    } else {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
    
    this.render();
  }
  
  reset() {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.currentStep = 0;
    this.executionTrace = [];
    
    // Reset state
    this.state.registers.fill(0);
    this.state.pc = 0;
    this.state.ir = 0;
    this.state.mar = 0;
    this.state.mdr = 0;
    this.state.flags = { z: 0, n: 0, c: 0, v: 0 };
    this.state.busA = 0;
    this.state.busB = 0;
    this.state.aluResult = 0;
    this.state.aluFlags = { z: 0, n: 0, c: 0, v: 0 };
    
    this.render();
    this.announceToScreenReader('Simulator reset');
  }
  
  setClockSpeed(speed) {
    this.options.clockSpeed = parseInt(speed);
    this.render();
    
    if (this.running) {
      // Restart with new speed
      this.toggleRunning();
      this.toggleRunning();
    }
  }
  
  loadPreset(presetKey) {
    if (this.presets[presetKey]) {
      this.currentPreset = presetKey;
      this.microProgram = [...this.presets[presetKey].microOps];
      this.reset();
      this.announceToScreenReader(`Loaded preset: ${this.presets[presetKey].name}`);
    }
  }
  
  addMicroOp() {
    const template = document.getElementById('micro-op-template')?.value;
    const custom = document.getElementById('custom-micro-op')?.value;
    const operation = custom || template;
    
    if (operation) {
      this.microProgram.push(operation);
      this.currentPreset = null; // Mark as custom
      
      // Clear inputs
      if (document.getElementById('micro-op-template')) {
        document.getElementById('micro-op-template').value = '';
      }
      if (document.getElementById('custom-micro-op')) {
        document.getElementById('custom-micro-op').value = '';
      }
      
      this.render();
      this.announceToScreenReader(`Added operation: ${operation}`);
    }
  }
  
  clearProgram() {
    this.microProgram = [];
    this.currentPreset = null;
    this.reset();
    this.announceToScreenReader('Program cleared');
  }
  
  updateRegister(regNum, value) {
    this.state.registers[regNum] = parseInt(value) || 0;
    this.render();
  }
  
  showImportExport() {
    const exportData = {
      microProgram: this.microProgram,
      state: this.state,
      presetName: this.currentPreset
    };
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Import/Export Configuration</h3>
        
        <div class="export-section">
          <h4>Export</h4>
          <textarea readonly class="export-data">${JSON.stringify(exportData, null, 2)}</textarea>
          <button class="btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.value)">Copy to Clipboard</button>
        </div>
        
        <div class="import-section">
          <h4>Import</h4>
          <textarea placeholder="Paste configuration JSON here..." class="import-data"></textarea>
          <button class="btn" onclick="datapathSim.importConfiguration(this.previousElementSibling.value)">Import</button>
        </div>
        
        <button class="btn secondary modal-close">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
  
  importConfiguration(jsonData) {
    try {
      const config = JSON.parse(jsonData);
      
      if (config.microProgram) {
        this.microProgram = config.microProgram;
      }
      
      if (config.state) {
        this.state = { ...this.state, ...config.state };
      }
      
      this.currentPreset = config.presetName || null;
      this.reset();
      this.render();
      
      this.announceToScreenReader('Configuration imported successfully');
      
      // Close modal
      document.querySelector('.modal-overlay')?.remove();
      
    } catch (error) {
      alert('Invalid JSON configuration: ' + error.message);
    }
  }
  
  bindEvents() {
    // Bind events for dynamic controls
    // Most events are handled via onclick attributes in the HTML
    // This method can be extended for more complex event handling
  }
  
  announceToScreenReader(message) {
    // Create or update screen reader announcement
    let announcer = document.getElementById('datapath-announcements');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'datapath-announcements';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    
    announcer.textContent = message;
  }
}

// Global variable for backward compatibility
let datapathSim;