package integrationutil

import (
	"archive/tar"
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"io"
	"math/big"
	"path/filepath"
	"time"

	"github.com/juanfont/headscale/integration/dockertestutil"
	"github.com/ory/dockertest/v3"
	"github.com/ory/dockertest/v3/docker"
)

func WriteFileToContainer(
	pool *dockertest.Pool,
	container *dockertest.Resource,
	path string,
	data []byte,
) error {
	dirPath, fileName := filepath.Split(path)

	file := bytes.NewReader(data)

	buf := bytes.NewBuffer([]byte{})

	tarWriter := tar.NewWriter(buf)

	header := &tar.Header{
		Name: fileName,
		Size: file.Size(),
		// Mode:    int64(stat.Mode()),
		// ModTime: stat.ModTime(),
	}

	err := tarWriter.WriteHeader(header)
	if err != nil {
		return fmt.Errorf("failed write file header to tar: %w", err)
	}

	_, err = io.Copy(tarWriter, file)
	if err != nil {
		return fmt.Errorf("failed to copy file to tar: %w", err)
	}

	err = tarWriter.Close()
	if err != nil {
		return fmt.Errorf("failed to close tar: %w", err)
	}

	// Ensure the directory is present inside the container
	_, _, err = dockertestutil.ExecuteCommand(
		container,
		[]string{"mkdir", "-p", dirPath},
		[]string{},
	)
	if err != nil {
		return fmt.Errorf("failed to ensure directory: %w", err)
	}

	err = pool.Client.UploadToContainer(
		container.Container.ID,
		docker.UploadToContainerOptions{
			NoOverwriteDirNonDir: false,
			Path:                 dirPath,
			InputStream:          bytes.NewReader(buf.Bytes()),
		},
	)
	if err != nil {
		return err
	}

	return nil
}

func FetchPathFromContainer(
	pool *dockertest.Pool,
	container *dockertest.Resource,
	path string,
) ([]byte, error) {
	buf := bytes.NewBuffer([]byte{})

	err := pool.Client.DownloadFromContainer(
		container.Container.ID,
		docker.DownloadFromContainerOptions{
			OutputStream: buf,
			Path:         path,
		},
	)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// nolint
func CreateCertificate(hostname string) ([]byte, []byte, error) {
	// From:
	// https://shaneutt.com/blog/golang-ca-and-signed-cert-go/

	ca := &x509.Certificate{
		SerialNumber: big.NewInt(2019),
		Subject: pkix.Name{
			Organization: []string{"Headscale testing INC"},
			Country:      []string{"NL"},
			Locality:     []string{"Leiden"},
		},
		NotBefore: time.Now(),
		NotAfter:  time.Now().Add(60 * time.Hour),
		IsCA:      true,
		ExtKeyUsage: []x509.ExtKeyUsage{
			x509.ExtKeyUsageClientAuth,
			x509.ExtKeyUsageServerAuth,
		},
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		BasicConstraintsValid: true,
	}

	caPrivKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return nil, nil, err
	}

	cert := &x509.Certificate{
		SerialNumber: big.NewInt(1658),
		Subject: pkix.Name{
			CommonName:   hostname,
			Organization: []string{"Headscale testing INC"},
			Country:      []string{"NL"},
			Locality:     []string{"Leiden"},
		},
		NotBefore:    time.Now(),
		NotAfter:     time.Now().Add(60 * time.Minute),
		SubjectKeyId: []byte{1, 2, 3, 4, 6},
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		KeyUsage:     x509.KeyUsageDigitalSignature,
		DNSNames:     []string{hostname},
	}

	certPrivKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return nil, nil, err
	}

	certBytes, err := x509.CreateCertificate(
		rand.Reader,
		cert,
		ca,
		&certPrivKey.PublicKey,
		caPrivKey,
	)
	if err != nil {
		return nil, nil, err
	}

	certPEM := new(bytes.Buffer)

	err = pem.Encode(certPEM, &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: certBytes,
	})
	if err != nil {
		return nil, nil, err
	}

	certPrivKeyPEM := new(bytes.Buffer)

	err = pem.Encode(certPrivKeyPEM, &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(certPrivKey),
	})
	if err != nil {
		return nil, nil, err
	}

	return certPEM.Bytes(), certPrivKeyPEM.Bytes(), nil
}
