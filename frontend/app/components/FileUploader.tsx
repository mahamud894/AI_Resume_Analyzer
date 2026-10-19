import {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import { formatSize } from '../lib/utils'
import { MAX_FILE_SIZE } from '~/constants'

interface FileUploaderProps {
    file: File | null;
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ file, onFileSelect }: FileUploaderProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0] || null;

        onFileSelect?.(file);
    }, [onFileSelect]);

    const maxFileSize = MAX_FILE_SIZE; // same limit as the backend

    const {getRootProps, getInputProps, fileRejections} = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/pdf': ['.pdf']},
        maxSize: maxFileSize,
    })

    const rejection = fileRejections[0]?.errors[0];

    return (
        <div className="w-full gradient-border">
            <div {...getRootProps({ className: 'rounded-2xl', 'aria-label': 'Choose your resume PDF' })}>
                <input {...getInputProps()} />

                <div className="space-y-4 cursor-pointer">
                    {file ? (
                        <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
                            <img src="/images/pdf.png" alt="pdf" className="size-10 shrink-0" />
                            <div className="flex flex-1 items-center space-x-3 min-w-0">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button type="button" aria-label="Remove file" className="flex items-center justify-center size-11 shrink-0 rounded-full cursor-pointer hover:bg-gray-100" onClick={(e) => {
                                e.stopPropagation();
                                onFileSelect?.(null)
                            }}>
                                <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                            </button>
                        </div>
                    ): (
                        <div className="flex flex-col items-center justify-center text-center min-h-[160px] sm:min-h-[200px] py-4">
                            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                                <img src="/icons/info.svg" alt="" className="size-16 sm:size-20" />
                            </div>
                            {/* Phones/tablets have no drag and drop — show a tap hint instead */}
                            <p className="text-base sm:text-lg text-gray-500 pointer-coarse:hidden">
                                <span className="font-semibold">
                                    Click to upload
                                </span> or drag and drop
                            </p>
                            <p className="hidden pointer-coarse:block text-lg font-semibold text-gray-600">
                                Tap to choose PDF
                            </p>
                            <p className="text-base sm:text-lg text-gray-500">PDF (max {formatSize(maxFileSize)})</p>
                        </div>
                    )}
                </div>
            </div>
            {rejection && (
                <p className="text-sm text-red-600 mt-2">
                    {rejection.code === 'file-too-large' ? `File is larger than ${formatSize(maxFileSize)}` : 'Only PDF files are allowed'}
                </p>
            )}
        </div>
    )
}
export default FileUploader
