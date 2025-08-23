# AI Chatbot Setup Guide - Ollama + Llama 3.2

This guide will help you set up the AI chatbot feature that allows tenants to submit maintenance requests through natural conversation.

## 🤖 What is the AI Chatbot?

The AI Maintenance Assistant lets tenants:
- Describe maintenance issues in plain English
- Have a natural conversation instead of filling forms
- Automatically generate maintenance requests from the conversation
- Get help understanding what information is needed

## 📋 Prerequisites

- **Ollama**: Local AI runtime
- **Llama 3.2**: The AI model (3B or 1B variant)
- **System Requirements**: 8GB+ RAM recommended

## 🚀 Installation Steps

### 1. Install Ollama

#### macOS
```bash
# Download and install from official website
curl https://ollama.ai/install.sh | sh

# Or using Homebrew
brew install ollama
```

#### Linux
```bash
curl https://ollama.ai/install.sh | sh
```

#### Windows
Download the installer from [ollama.ai](https://ollama.ai/download)

### 2. Start Ollama Service

```bash
# Start Ollama (runs in background)
ollama serve
```

### 3. Pull Llama 3.2 Model

```bash
# Download Llama 3.2 (3B parameters - recommended)
ollama pull llama3.2

# Or for lower memory usage (1B parameters)
ollama pull llama3.2:1b
```

### 4. Test the Installation

```bash
# Test if Ollama is running
curl http://localhost:11434/api/tags

# Test chat with Llama 3.2
ollama run llama3.2
```

## 🔧 Configuration

### Backend Configuration

The Flask backend is already configured to connect to Ollama at:
- **URL**: `http://localhost:11434`
- **Model**: `llama3.2`

If you need to change these settings, edit `routes/chatbot_routes.py`:

```python
class OllamaService:
    def __init__(self, base_url="http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama3.2"  # Change model here
```

### Frontend Features

The chatbot includes:
- ✅ **Status Monitoring**: Shows if Ollama is online/offline
- ✅ **Property Selection**: Tenants select which property needs maintenance
- ✅ **Natural Conversation**: AI guides tenants through the process
- ✅ **Auto-Extraction**: Converts conversation to structured maintenance request
- ✅ **Fallback Support**: Works even if AI extraction fails

## 📱 How to Use

### For Tenants:

1. **Navigate** to Maintenance Request page
2. **Click** "Try AI Assistant" button
3. **Select** your property from dropdown
4. **Chat** with the AI about your maintenance issue
5. **Submit** the automatically generated request

### Example Conversation:

```
AI: Hi! I'm your AI maintenance assistant. What seems to be the problem?

Tenant: My kitchen faucet is leaking really badly

AI: I understand you have a leaking kitchen faucet. How severe is the leak? 
Is it dripping occasionally or constantly flowing?

Tenant: It's dripping constantly and there's water pooling on the counter

AI: That sounds like it needs prompt attention. Are there any safety concerns? 
Is the water affecting electrical outlets or causing slipping hazards?

Tenant: No safety issues, but it's wasting a lot of water

AI: Perfect! I have enough information. Would you like me to submit this 
maintenance request for you?

[Submit Maintenance Request Button Appears]
```

## 🔍 Troubleshooting

### Ollama Not Running
```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama if not running
ollama serve
```

### Model Not Found
```bash
# List available models
ollama list

# Pull the model if missing
ollama pull llama3.2
```

### Memory Issues
```bash
# Use smaller model variant
ollama pull llama3.2:1b

# Or try Phi 3 (even smaller)
ollama pull phi3:mini
```

### API Connection Issues
```bash
# Test API directly
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello",
  "stream": false
}'
```

## ⚡ Performance Tips

### For Better Performance:
- **Use SSD**: Store models on SSD for faster loading
- **Allocate RAM**: Ensure 8GB+ available RAM
- **Close Apps**: Close unnecessary applications
- **Use GPU**: Ollama automatically uses GPU if available

### Model Variants:
- **llama3.2** (3B): Best quality, needs ~4GB RAM
- **llama3.2:1b** (1B): Good quality, needs ~2GB RAM
- **phi3:mini**: Fastest, smallest, needs ~1GB RAM

## 🔐 Security Notes

- Ollama runs locally - no data sent to external servers
- All conversations stay on your system
- AI model runs in isolated environment
- No internet connection required for AI processing

## 🆘 Support

If you encounter issues:

1. **Check Status**: Use the frontend status indicator
2. **Restart Services**: Restart both Ollama and Flask
3. **Check Logs**: Look at Flask console for error messages
4. **Fallback Mode**: Chatbot works even if AI is offline

## 📊 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 4GB | 8GB+ |
| Storage | 2GB | 5GB+ |
| CPU | 2 cores | 4+ cores |
| OS | macOS 10.15+, Ubuntu 18+, Windows 10+ | Latest versions |

---

🎉 **Congratulations!** Your AI-powered maintenance chatbot is ready to help tenants submit requests effortlessly! 