import { toPng } from 'html-to-image';

export const exportAsImage = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    try {
        // Optimize for export
        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#f8fafc', // Slate 50 to match background
            style: {
                borderRadius: '0',
                padding: '20px'
            }
        });

        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('Error exporting image:', error);
    }
};
