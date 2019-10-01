get the zip:
  file.managed:
    - name: /root/server.tar.gz
    - source:
      - 'https://github.com/cdr/code-server/releases/download/1.1156-vsc1.33.1/code-server1.1156-vsc1.33.1-linux-x64.tar.gz'
    - source_hash: 4ee768c461e5c58f2ec1eeaafb8174164eb4f1ac617e1a342ccf51c36a073c13

codeserver_extracted:
  archive.extracted:
    - name: /root
    - source: /root/server.tar.gz

get the file:
  file.managed:
    - name: /etc/systemd/system/codeserver.service
    - source:
      - salt://code/files/code-server.service

start_codeserver:
  service.running:
    - name: codeserver
    - enable: True

get_password:
  cmd.run:
    - name: sleep 15 && /bin/journalctl -u codeserver | /bin/grep Password | /usr/bin/tail -c 25
