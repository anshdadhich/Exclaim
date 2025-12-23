const vscode = require('vscode');

function activate(context) {
  console.log('Smart Comment Cleaner is active!');

  
  let disposable = vscode.commands.registerCommand('comment-emoji-cleaner.clean', function () {
    cleanActiveEditor();
  });

  
  let saveDisposable = vscode.workspace.onWillSaveTextDocument((event) => {
    const config = vscode.workspace.getConfiguration('commentEmojiCleaner');
    if (config.get('cleanOnSave', true)) {
      const document = event.document;
      const text = document.getText();
      const languageId = document.languageId;
      
      const cleaned = cleanText(text, languageId);
      
      if (cleaned !== text) {
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        );
        edit.replace(document.uri, fullRange, cleaned);
        event.waitUntil(vscode.workspace.applyEdit(edit));
      }
    }
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(saveDisposable);
}

function cleanActiveEditor() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const text = document.getText();
  const cleaned = cleanText(text, document.languageId);

  if (text !== cleaned) {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );
    edit.replace(document.uri, fullRange, cleaned);
    vscode.workspace.applyEdit(edit);
  }
}

function cleanText(text, languageId) {
  
  
  
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}\u{FE0F}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu;
  text = text.replace(emojiRegex, '');

  const config = getLanguageConfig(languageId);
  const regex = generateLexerRegex(config);

  if (!regex) return text;

  
  return text.replace(regex, (match, stringGroup, multiCommentGroup, singleCommentGroup) => {
    
    if (stringGroup) {
      return match;
    }

    
    const commentContent = multiCommentGroup || singleCommentGroup;

    if (commentContent) {
      
      
      
      
      
      
      
      
      
      let content = "";
      if (match === multiCommentGroup) {
         content = match.slice(config.comments.multi.start.length);
      } else {
         content = match.slice(config.comments.single.length);
      }
      
      if (content.trim().startsWith('!!')) {
        return match; 
      }
      
      return ''; 
    }

    return match; 
  });
}


function generateLexerRegex(config) {
  const parts = [];

  
  
  
  if (config.strings && config.strings.length > 0) {
    const stringPatterns = config.strings.map(pattern => {
      
      if (pattern === 'lua_long') {
        return '\\[(=*)\\[[\\s\\S]*?\\]\\1\\]';
      }
      
      const q = pattern; 
      return `${q}(?:[^\\\\${q}]|\\\\.)*${q}`; 
    });
    
    parts.push(`(${stringPatterns.join('|')})`);
  } else {
    parts.push('()'); 
  }

  
  
  if (config.comments.multi) {
    const start = escapeRegExp(config.comments.multi.start);
    const end = escapeRegExp(config.comments.multi.end);
    parts.push(`(${start}[\\s\\S]*?${end})`); 
  } else {
    parts.push('()'); 
  }

  
  
  if (config.comments.single) {
    const start = escapeRegExp(config.comments.single);
    parts.push(`(${start}.*$)`); 
  } else {
    parts.push('()'); 
  }

  
  return new RegExp(parts.join('|'), 'gm');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getLanguageConfig(languageId) {
  
  const stdStrings = ['"', "'", '`']; 
  const pyStrings = ['"""', "'''", '"', "'"]; 
  const luaStrings = ['"', "'", 'lua_long']; 

  const definitions = {
    
    javascript: { 
      strings: stdStrings, 
      comments: { single: '//', multi: { start: '/*', end: '*/' } } 
    },
    typescript: { 
      strings: stdStrings, 
      comments: { single: '//', multi: { start: '/*', end: '*/' } } 
    },
    c: { 
      strings: ['"', "'"], 
      comments: { single: '//', multi: { start: '/*', end: '*/' } } 
    },
    cpp: { 
      strings: ['"', "'"], 
      comments: { single: '//', multi: { start: '/*', end: '*/' } } 
    },
    java: { 
      strings: ['"', "'"], 
      comments: { single: '//', multi: { start: '/*', end: '*/' } } 
    },
    
    
    
    python: { 
      strings: pyStrings, 
      comments: { single: '#', multi: null } 
    },
    
    
    lua: { 
      strings: luaStrings, 
      comments: { single: '--', multi: { start: '--[[', end: ']]' } } 
    },
    
    
    r: {
      strings: ['"', "'"],
      comments: { single: '#', multi: null }
    },

    
    yaml: {
      strings: ['"', "'"],
      comments: { single: '#', multi: null }
    },

    
    php: {
      strings: ['"', "'"],
      comments: { single: '//', multi: { start: '/*', end: '*/' } }
    },
    
    
    html: {
      strings: ['"', "'"],
      comments: { single: null, multi: { start: '' } }
    },
    
    
    default: { 
      strings: ['"', "'"], 
      comments: { single: '//', multi: { start: '/*', end: '*/' } } 
    }
  };

  
  definitions.javascriptreact = definitions.javascript;
  definitions.typescriptreact = definitions.typescript;
  definitions.go = definitions.c;
  definitions.rust = definitions.c;
  definitions.swift = definitions.c;
  definitions.kotlin = definitions.c;
  definitions.shellscript = definitions.r; 
  definitions.bash = definitions.r;
  definitions.dockerfile = definitions.r;

  return definitions[languageId] || definitions.default;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};