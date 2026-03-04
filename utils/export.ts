import { Category, Note, Tag } from '@/types/note';
import { Platform, Share } from 'react-native';

export function exportNoteToMarkdown(note: Note, category?: Category) {
    let markdown = `# ${note.title || 'Untitled'}\n\n`;
    if (category) {
        markdown += `**Category:** ${category.icon} ${category.name}\n`;
    }
    markdown += `**Created:** ${new Date(note.createdAt).toLocaleString()}\n`;
    markdown += `**Modified:** ${new Date(note.updatedAt).toLocaleString()}\n\n`;
    markdown += `---\n\n`;
    markdown += note.content;

    shareText(markdown, `${note.title || 'untitled'}.md`);
}

export function exportNoteToText(note: Note) {
    let text = `${note.title || 'Untitled'}\n`;
    text += `${'='.repeat((note.title || 'Untitled').length)}\n\n`;
    text += `Created: ${new Date(note.createdAt).toLocaleString()}\n`;
    text += `Modified: ${new Date(note.updatedAt).toLocaleString()}\n\n`;
    text += note.content;

    shareText(text, `${note.title || 'untitled'}.txt`);
}

export function exportToJSON(notes: Note[], categories: Category[], tags: Tag[]) {
    const data = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        notes,
        categories,
        tags,
    };

    shareText(JSON.stringify(data, null, 2), `aconcci-notes-${new Date().toISOString().split('T')[0]}.json`);
}

async function shareText(content: string, filename: string) {
    try {
        if (Platform.OS === 'web') {
            // Web: use Blob download
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            // Native: use Share API
            await Share.share({
                message: content,
                title: filename,
            });
        }
    } catch (error) {
        console.error('Export failed:', error);
    }
}
