
export interface VoiceCommand {
  pattern: RegExp;
  action: string;
  handler: (matches: string[]) => void;
  description: string;
}

export interface VoiceEngineSettings {
  enabled: boolean;
  hotword: string;
  useHotword: boolean;
  useTTS: boolean;
  confidence: number;
  language: string;
}

export class VoiceEngine {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private commands: VoiceCommand[] = [];
  private settings: VoiceEngineSettings = {
    enabled: true,
    hotword: 'hey vibe',
    useHotword: false,
    useTTS: true,
    confidence: 0.7,
    language: 'en-US'
  };

  constructor() {
    this.initSpeechRecognition();
    this.initTextToSpeech();
    this.registerDefaultCommands();
  }

  private initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.settings.language;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.dispatchEvent('voice:listening', { listening: true });
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.dispatchEvent('voice:listening', { listening: false });
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal && lastResult[0].confidence >= this.settings.confidence) {
        const transcript = lastResult[0].transcript.trim().toLowerCase();
        this.processCommand(transcript);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      this.dispatchEvent('voice:error', { error: event.error });
    };
  }

  private initTextToSpeech() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  private registerDefaultCommands() {
    // Note commands
    this.registerCommand({
      pattern: /(?:take a note|create a note|note):?\s*(.+)/i,
      action: 'createNote',
      handler: (matches) => {
        const content = matches[1];
        this.dispatchEvent('voice:command', { action: 'createNote', payload: content });
        this.speak(`Note created: ${content}`);
      },
      description: 'Create a new note'
    });

    // Todo commands
    this.registerCommand({
      pattern: /(?:add to my todo|create todo|todo):?\s*(.+)/i,
      action: 'addTodo',
      handler: (matches) => {
        const task = matches[1];
        this.dispatchEvent('voice:command', { action: 'addTodo', payload: task });
        this.speak(`Added to your todo list: ${task}`);
      },
      description: 'Add a new todo item'
    });

    // Timer commands
    this.registerCommand({
      pattern: /start\s+(?:a\s+)?(\d+)?\s*(?:minute|min)?\s*(?:timer|pomodoro)/i,
      action: 'startTimer',
      handler: (matches) => {
        const duration = parseInt(matches[1]) || 25;
        this.dispatchEvent('voice:command', { action: 'startTimer', payload: duration });
        this.speak(`Starting ${duration} minute timer`);
      },
      description: 'Start a timer'
    });

    // Music commands
    this.registerCommand({
      pattern: /(?:pause|play|stop)\s+(?:music|spotify)/i,
      action: 'controlMusic',
      handler: (matches) => {
        const action = matches[0].split(' ')[0];
        this.dispatchEvent('voice:command', { action: 'controlMusic', payload: action });
        this.speak(`${action}ing music`);
      },
      description: 'Control music playback'
    });

    // Query commands
    this.registerCommand({
      pattern: /(?:what's on my todo|read my todos|show my tasks)/i,
      action: 'readTodos',
      handler: () => {
        this.dispatchEvent('voice:command', { action: 'readTodos', payload: null });
      },
      description: 'Read todo list'
    });

    // Bookmark commands
    this.registerCommand({
      pattern: /(?:save this site|bookmark this|add bookmark)/i,
      action: 'saveBookmark',
      handler: () => {
        this.dispatchEvent('voice:command', { action: 'saveBookmark', payload: window.location.href });
        this.speak('Bookmark saved');
      },
      description: 'Save current page as bookmark'
    });
  }

  registerCommand(command: VoiceCommand) {
    this.commands.push(command);
  }

  private processCommand(transcript: string) {
    console.log('Processing voice command:', transcript);
    
    // Check for hotword if enabled
    if (this.settings.useHotword && !transcript.includes(this.settings.hotword)) {
      return;
    }

    // Remove hotword from transcript
    const cleanTranscript = transcript.replace(new RegExp(this.settings.hotword, 'i'), '').trim();
    
    // Find matching command
    for (const command of this.commands) {
      const matches = cleanTranscript.match(command.pattern);
      if (matches) {
        try {
          command.handler(matches);
          return;
        } catch (error) {
          console.error('Error executing voice command:', error);
          this.speak('Sorry, there was an error executing that command');
        }
      }
    }

    // No command found
    this.speak("Sorry, I didn't understand that command");
    this.dispatchEvent('voice:unrecognized', { transcript: cleanTranscript });
  }

  startListening() {
    if (this.recognition && this.settings.enabled && !this.isListening) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  speak(text: string) {
    if (this.synthesis && this.settings.useTTS) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      this.synthesis.speak(utterance);
    }
  }

  updateSettings(newSettings: Partial<VoiceEngineSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (this.recognition) {
      this.recognition.lang = this.settings.language;
    }
  }

  getSettings() {
    return { ...this.settings };
  }

  isCurrentlyListening() {
    return this.isListening;
  }

  getCommands() {
    return [...this.commands];
  }

  private dispatchEvent(type: string, detail: any) {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

export const voiceEngine = new VoiceEngine();
