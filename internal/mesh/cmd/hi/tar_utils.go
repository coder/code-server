package main

import (
	"archive/tar"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// ErrFileNotFoundInTar indicates a file was not found in the tar archive.
var ErrFileNotFoundInTar = errors.New("file not found in tar")

// extractFileFromTar extracts a single file from a tar reader.
func extractFileFromTar(tarReader io.Reader, fileName, outputPath string) error {
	tr := tar.NewReader(tarReader)

	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to read tar header: %w", err)
		}

		// Check if this is the file we're looking for
		if filepath.Base(header.Name) == fileName {
			if header.Typeflag == tar.TypeReg {
				// Create the output file
				outFile, err := os.Create(outputPath)
				if err != nil {
					return fmt.Errorf("failed to create output file: %w", err)
				}
				defer outFile.Close()

				// Copy file contents
				if _, err := io.Copy(outFile, tr); err != nil {
					return fmt.Errorf("failed to copy file contents: %w", err)
				}

				return nil
			}
		}
	}

	return fmt.Errorf("%w: %s", ErrFileNotFoundInTar, fileName)
}

// extractDirectoryFromTar extracts all files from a tar reader to a target directory.
func extractDirectoryFromTar(tarReader io.Reader, targetDir string) error {
	tr := tar.NewReader(tarReader)

	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to read tar header: %w", err)
		}

		// Clean the path to prevent directory traversal
		cleanName := filepath.Clean(header.Name)
		if strings.Contains(cleanName, "..") {
			continue // Skip potentially dangerous paths
		}

		targetPath := filepath.Join(targetDir, filepath.Base(cleanName))

		switch header.Typeflag {
		case tar.TypeDir:
			// Create directory
			if err := os.MkdirAll(targetPath, os.FileMode(header.Mode)); err != nil {
				return fmt.Errorf("failed to create directory %s: %w", targetPath, err)
			}
		case tar.TypeReg:
			// Create file
			outFile, err := os.Create(targetPath)
			if err != nil {
				return fmt.Errorf("failed to create file %s: %w", targetPath, err)
			}

			if _, err := io.Copy(outFile, tr); err != nil {
				outFile.Close()
				return fmt.Errorf("failed to copy file contents: %w", err)
			}
			outFile.Close()

			// Set file permissions
			if err := os.Chmod(targetPath, os.FileMode(header.Mode)); err != nil {
				return fmt.Errorf("failed to set file permissions: %w", err)
			}
		}
	}

	return nil
}
