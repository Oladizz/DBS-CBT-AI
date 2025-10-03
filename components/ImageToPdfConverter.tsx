
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { UploadIcon, TrashIcon, ArrowLeftIcon, DocumentTextIcon } from './icons';
import Card from './common/Card';
import Spinner from './common/Spinner';

interface ImageToPdfConverterProps {
  onExit: () => void;
}

const ImageToPdfConverter: React.FC<ImageToPdfConverterProps> = ({ onExit }) => {
  const [images, setImages] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cleanup blob URL on component unmount or when a new PDF is made
  useEffect(() => {
    const currentPdfUrl = pdfUrl;
    return () => {
      if (currentPdfUrl) {
        URL.revokeObjectURL(currentPdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFileChange = (files: FileList | null) => {
    if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
    }
    setError(null);
    if (files) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      const newImages = Array.from(files).filter(file => allowedTypes.includes(file.type));
      if (newImages.length !== files.length) {
          setError("Some files were not valid image types (only JPG and PNG are accepted).");
      }
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
    }
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    setError(null);
    if (pdfUrl) { // Revoke previous URL if exists
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
    }

    try {
      // Default is 'portrait', 'mm', 'a4'
      const doc = new jsPDF();
      for (let i = 0; i < images.length; i++) {
        const imageFile = images[i];
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });

        const img = new Image();
        img.src = dataUrl;
        await new Promise(resolve => { img.onload = resolve; });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - margin * 2;

        const imgRatio = img.width / img.height;
        const pageRatio = availableWidth / availableHeight;

        let imgWidth, imgHeight;
        if (imgRatio > pageRatio) {
          imgWidth = availableWidth;
          imgHeight = imgWidth / imgRatio;
        } else {
          imgHeight = availableHeight;
          imgWidth = imgHeight * imgRatio;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;
        
        if (i > 0) {
          doc.addPage();
        }
        // Use PNG for pngs to preserve transparency, otherwise JPEG
        const format = imageFile.type === 'image/png' ? 'PNG' : 'JPEG';
        doc.addImage(dataUrl, format, x, y, imgWidth, imgHeight);
      }
      
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

    } catch (e) {
      console.error(e);
      setError("An error occurred while converting the images to PDF.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-indigo-600 flex items-center"><DocumentTextIcon className="w-8 h-8 mr-2"/> Image to PDF Converter</h1>
            <button onClick={onExit} className="text-sm font-medium text-slate-600 hover:text-indigo-600">Back to Home</button>
        </header>

        <Card className="p-6">
            <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-12 text-center bg-slate-50"
            >
                <UploadIcon className="w-16 h-16 text-slate-400" />
                <p className="mt-4 font-semibold text-slate-700">Drag & drop your images here</p>
                <p className="text-slate-500">or</p>
                <label htmlFor="image-upload" className="mt-2 cursor-pointer relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 shadow-sm">
                    <span>Select Files</span>
                    <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e.target.files)} multiple />
                </label>
                 <p className="text-xs text-slate-400 mt-4">Supports PNG and JPG formats</p>
            </div>

            {error && <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

            {images.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-4">Image Preview ({images.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {images.map((image, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img src={URL.createObjectURL(image)} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md shadow-sm" />
                                <button 
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                    aria-label="Remove image"
                                >
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                    onClick={convertToPdf}
                    disabled={images.length === 0 || isConverting}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isConverting ? <><Spinner size="w-5 h-5 mr-2"/> Converting...</> : "Convert to PDF"}
                </button>
                {pdfUrl && (
                     <a 
                        href={pdfUrl}
                        download={`converted-document-${new Date().toISOString().split('T')[0]}.pdf`}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                       Download PDF
                    </a>
                )}
            </div>
        </Card>
    </div>
  );
};

export default ImageToPdfConverter;
