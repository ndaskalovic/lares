const apiSchema = [
 {
  "children": [
   {
    "info": {
     "GET": {
      "allowtoken": 1,
      "description": "Resources index (cluster wide).",
      "method": "GET",
      "name": "resources",
      "parameters": {
       "additionalProperties": 0,
       "properties": {
        "type": {
         "description": "Resource type.",
         "enum": [
          "vm",
          "storage",
          "node",
          "sdn"
         ],
         "optional": 1,
         "type": "string"
        }
       }
      },
      "permissions": {
       "user": "all"
      }
     }
    },
    "leaf": 1,
    "path": "/cluster/resources",
    "text": "resources"
   }
  ],
  "leaf": 0,
  "path": "/cluster",
  "text": "cluster"
 },
 {
  "children": [
   {
    "children": [
     {
      "children": [
       {
        "children": [
         {
          "children": [
           {
            "info": {
             "GET": {
              "allowtoken": 1,
              "description": "Execute get-osinfo.",
              "method": "GET",
              "name": "get-osinfo",
              "parameters": {
               "additionalProperties": 0,
               "properties": {
                "node": {
                 "description": "The cluster node name.",
                 "type": "string",
                 "typetext": "<string>"
                },
                "vmid": {
                 "description": "The (unique) ID of the VM.",
                 "maximum": 999999999,
                 "minimum": 100,
                 "type": "integer",
                 "typetext": "<integer> (100 - 999999999)"
                }
               }
              },
              "permissions": {
               "check": [
                "perm",
                "/vms/{vmid}",
                [
                 "VM.Monitor"
                ]
               ]
              },
              "protected": 1,
              "proxyto": "node"
             }
            },
            "leaf": 1,
            "path": "/nodes/{node}/qemu/{vmid}/agent/get-osinfo",
            "text": "get-osinfo"
           },
           {
            "info": {
             "POST": {
              "allowtoken": 1,
              "description": "Executes the given command in the vm via the guest-agent and returns an object with the pid.",
              "method": "POST",
              "name": "exec",
              "parameters": {
               "additionalProperties": 0,
               "properties": {
                "command": {
                 "description": "The command as a list of program + arguments.",
                 "items": {
                  "description": "A single part of the program + arguments.",
                  "format": "string"
                 },
                 "type": "array",
                 "typetext": "<array>"
                },
                "input-data": {
                 "description": "Data to pass as 'input-data' to the guest. Usually treated as STDIN to 'command'.",
                 "maxLength": 65536,
                 "optional": 1,
                 "type": "string",
                 "typetext": "<string>"
                },
                "node": {
                 "description": "The cluster node name.",
                 "type": "string",
                 "typetext": "<string>"
                },
                "vmid": {
                 "description": "The (unique) ID of the VM.",
                 "maximum": 999999999,
                 "minimum": 100,
                 "type": "integer",
                 "typetext": "<integer> (100 - 999999999)"
                }
               }
              },
              "permissions": {
               "check": [
                "perm",
                "/vms/{vmid}",
                [
                 "VM.Monitor"
                ]
               ]
              },
              "protected": 1,
              "proxyto": "node"
             }
            },
            "leaf": 1,
            "path": "/nodes/{node}/qemu/{vmid}/agent/exec",
            "text": "exec"
           }
          ],
          "leaf": 0,
          "path": "/nodes/{node}/qemu/{vmid}/agent",
          "text": "agent"
         },
         {
          "info": {
           "GET": {
            "allowtoken": 1,
            "description": "Get the virtual machine configuration with pending configuration changes applied. Set the 'current' parameter to get the current configuration instead.",
            "method": "GET",
            "name": "vm_config",
            "parameters": {
             "additionalProperties": 0,
             "properties": {
              "current": {
               "default": 0,
               "description": "Get current values (instead of pending values).",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "node": {
               "description": "The cluster node name.",
               "type": "string",
               "typetext": "<string>"
              },
              "snapshot": {
               "description": "Fetch config values from given snapshot.",
               "maxLength": 40,
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "vmid": {
               "description": "The (unique) ID of the VM.",
               "maximum": 999999999,
               "minimum": 100,
               "type": "integer",
               "typetext": "<integer> (100 - 999999999)"
              }
             }
            },
            "permissions": {
             "check": [
              "perm",
              "/vms/{vmid}",
              [
               "VM.Audit"
              ]
             ]
            },
            "proxyto": "node"
           },
           "POST": {
            "allowtoken": 1,
            "description": "Set virtual machine options (asynchronous API).",
            "method": "POST",
            "name": "update_vm_async",
            "parameters": {
             "additionalProperties": 0,
             "properties": {
              "acpi": {
               "default": 1,
               "description": "Enable/disable ACPI.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "affinity": {
               "description": "List of host cores used to execute guest processes, for example: 0,5,8-11",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "agent": {
               "description": "Enable/disable communication with the QEMU Guest Agent and its properties.",
               "optional": 1,
               "type": "string",
               "typetext": "[enabled=]<1|0> [,freeze-fs-on-backup=<1|0>] [,fstrim_cloned_disks=<1|0>] [,type=<virtio|isa>]"
              },
              "amd-sev": {
               "description": "Secure Encrypted Virtualization (SEV) features by AMD CPUs",
               "optional": 1,
               "type": "string",
               "typetext": "[type=]<sev-type> [,allow-smt=<1|0>] [,kernel-hashes=<1|0>] [,no-debug=<1|0>] [,no-key-sharing=<1|0>]"
              },
              "arch": {
               "description": "Virtual processor architecture. Defaults to the host.",
               "enum": [
                "x86_64",
                "aarch64"
               ],
               "optional": 1,
               "type": "string"
              },
              "args": {
               "description": "Arbitrary arguments passed to kvm.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>",
               "verbose_description": "Arbitrary arguments passed to kvm, for example:\n\nargs: -no-reboot -smbios 'type=0,vendor=FOO'\n\nNOTE: this option is for experts only.\n"
              },
              "audio0": {
               "description": "Configure a audio device, useful in combination with QXL/Spice.",
               "optional": 1,
               "type": "string",
               "typetext": "device=<ich9-intel-hda|intel-hda|AC97> [,driver=<spice|none>]"
              },
              "autostart": {
               "default": 0,
               "description": "Automatic restart after crash (currently ignored).",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "background_delay": {
               "description": "Time to wait for the task to finish. We return 'null' if the task finish within that time.",
               "maximum": 30,
               "minimum": 1,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (1 - 30)"
              },
              "balloon": {
               "description": "Amount of target RAM for the VM in MiB. Using zero disables the ballon driver.",
               "minimum": 0,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (0 - N)"
              },
              "bios": {
               "default": "seabios",
               "description": "Select BIOS implementation.",
               "enum": [
                "seabios",
                "ovmf"
               ],
               "optional": 1,
               "type": "string"
              },
              "boot": {
               "description": "Specify guest boot order. Use the 'order=' sub-property as usage with no key or 'legacy=' is deprecated.",
               "optional": 1,
               "type": "string",
               "typetext": "[[legacy=]<[acdn]{1,4}>] [,order=<device[;device...]>]"
              },
              "bootdisk": {
               "description": "Enable booting from specified disk. Deprecated: Use 'boot: order=foo;bar' instead.",
               "optional": 1,
               "pattern": "(ide|sata|scsi|virtio)\\d+",
               "type": "string"
              },
              "cdrom": {
               "description": "This is an alias for option -ide2",
               "optional": 1,
               "type": "string",
               "typetext": "<volume>"
              },
              "cicustom": {
               "description": "cloud-init: Specify custom files to replace the automatically generated ones at start.",
               "optional": 1,
               "type": "string",
               "typetext": "[meta=<volume>] [,network=<volume>] [,user=<volume>] [,vendor=<volume>]"
              },
              "cipassword": {
               "description": "cloud-init: Password to assign the user. Using this is generally not recommended. Use ssh keys instead. Also note that older cloud-init versions do not support hashed passwords.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "citype": {
               "description": "Specifies the cloud-init configuration format. The default depends on the configured operating system type (`ostype`. We use the `nocloud` format for Linux, and `configdrive2` for windows.",
               "enum": [
                "configdrive2",
                "nocloud",
                "opennebula"
               ],
               "optional": 1,
               "type": "string"
              },
              "ciupgrade": {
               "default": 1,
               "description": "cloud-init: do an automatic package upgrade after the first boot.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "ciuser": {
               "description": "cloud-init: User name to change ssh keys and password for instead of the image's configured default user.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "cores": {
               "default": 1,
               "description": "The number of cores per socket.",
               "minimum": 1,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (1 - N)"
              },
              "cpu": {
               "description": "Emulated CPU type.",
               "optional": 1,
               "type": "string",
               "typetext": "[[cputype=]<string>] [,flags=<+FLAG[;-FLAG...]>] [,hidden=<1|0>] [,hv-vendor-id=<vendor-id>] [,phys-bits=<8-64|host>] [,reported-model=<enum>]"
              },
              "cpulimit": {
               "default": 0,
               "description": "Limit of CPU usage.",
               "maximum": 128,
               "minimum": 0,
               "optional": 1,
               "type": "number",
               "typetext": "<number> (0 - 128)",
               "verbose_description": "Limit of CPU usage.\n\nNOTE: If the computer has 2 CPUs, it has total of '2' CPU time. Value '0' indicates no CPU limit."
              },
              "cpuunits": {
               "default": "cgroup v1: 1024, cgroup v2: 100",
               "description": "CPU weight for a VM, will be clamped to [1, 10000] in cgroup v2.",
               "maximum": 262144,
               "minimum": 1,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (1 - 262144)",
               "verbose_description": "CPU weight for a VM. Argument is used in the kernel fair scheduler. The larger the number is, the more CPU time this VM gets. Number is relative to weights of all the other running VMs."
              },
              "delete": {
               "description": "A list of settings you want to delete.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "description": {
               "description": "Description for the VM. Shown in the web-interface VM's summary. This is saved as comment inside the configuration file.",
               "maxLength": 8192,
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "digest": {
               "description": "Prevent changes if current configuration file has different SHA1 digest. This can be used to prevent concurrent modifications.",
               "maxLength": 40,
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "efidisk0": {
               "description": "Configure a disk for storing EFI vars. Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Note that SIZE_IN_GiB is ignored here and that the default EFI vars are copied to the volume instead. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,efitype=<2m|4m>] [,format=<enum>] [,import-from=<source volume>] [,ms-cert=<enum>] [,pre-enrolled-keys=<1|0>] [,size=<DiskSize>]"
              },
              "force": {
               "description": "Force physical removal. Without this, we simple remove the disk from the config file and create an additional configuration entry called 'unused[n]', which contains the volume ID. Unlink of unused[n] always cause physical removal.",
               "optional": 1,
               "requires": "delete",
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "freeze": {
               "description": "Freeze CPU at startup (use 'c' monitor command to start execution).",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "hookscript": {
               "description": "Script that will be executed during various steps in the vms lifetime.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "hostpci[n]": {
               "description": "Map host PCI devices into guest.",
               "optional": 1,
               "type": "string",
               "typetext": "[[host=]<HOSTPCIID[;HOSTPCIID2...]>] [,device-id=<hex id>] [,legacy-igd=<1|0>] [,mapping=<mapping-id>] [,mdev=<string>] [,pcie=<1|0>] [,rombar=<1|0>] [,romfile=<string>] [,sub-device-id=<hex id>] [,sub-vendor-id=<hex id>] [,vendor-id=<hex id>] [,x-vga=<1|0>]",
               "verbose_description": "Map host PCI devices into guest.\n\nNOTE: This option allows direct access to host hardware. So it is no longer\npossible to migrate such machines - use with special care.\n\nCAUTION: Experimental! User reported problems with this option.\n"
              },
              "hotplug": {
               "default": "network,disk,usb",
               "description": "Selectively enable hotplug features. This is a comma separated list of hotplug features: 'network', 'disk', 'cpu', 'memory', 'usb' and 'cloudinit'. Use '0' to disable hotplug completely. Using '1' as value is an alias for the default `network,disk,usb`. USB hotplugging is possible for guests with machine version >= 7.1 and ostype l26 or windows > 7.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "hugepages": {
               "description": "Enable/disable hugepages memory.",
               "enum": [
                "any",
                "2",
                "1024"
               ],
               "optional": 1,
               "type": "string"
              },
              "ide[n]": {
               "description": "Use volume as IDE hard disk or CD-ROM (n is 0 to 3). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,model=<model>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,ssd=<1|0>] [,trans=<none|lba|auto>] [,werror=<enum>] [,wwn=<wwn>]"
              },
              "import-working-storage": {
               "description": "A file-based storage with 'images' content-type enabled, which is used as an intermediary extraction storage during import. Defaults to the source storage.",
               "format_description": "storage ID",
               "optional": 1,
               "type": "string",
               "typetext": "<storage ID>"
              },
              "ipconfig[n]": {
               "description": "cloud-init: Specify IP addresses and gateways for the corresponding interface.\n\nIP addresses use CIDR notation, gateways are optional but need an IP of the same type specified.\n\nThe special string 'dhcp' can be used for IP addresses to use DHCP, in which case no explicit\ngateway should be provided.\nFor IPv6 the special string 'auto' can be used to use stateless autoconfiguration. This requires\ncloud-init 19.4 or newer.\n\nIf cloud-init is enabled and neither an IPv4 nor an IPv6 address is specified, it defaults to using\ndhcp on IPv4.\n",
               "optional": 1,
               "type": "string",
               "typetext": "[gw=<GatewayIPv4>] [,gw6=<GatewayIPv6>] [,ip=<IPv4Format/CIDR>] [,ip6=<IPv6Format/CIDR>]"
              },
              "ivshmem": {
               "description": "Inter-VM shared memory. Useful for direct communication between VMs, or to the host.",
               "optional": 1,
               "type": "string",
               "typetext": "size=<integer> [,name=<string>]"
              },
              "keephugepages": {
               "default": 0,
               "description": "Use together with hugepages. If enabled, hugepages will not not be deleted after VM shutdown and can be used for subsequent starts.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "keyboard": {
               "default": null,
               "description": "Keyboard layout for VNC server. This option is generally not required and is often better handled from within the guest OS.",
               "enum": [
                "de",
                "de-ch",
                "da",
                "en-gb",
                "en-us",
                "es",
                "fi",
                "fr",
                "fr-be",
                "fr-ca",
                "fr-ch",
                "hu",
                "is",
                "it",
                "ja",
                "lt",
                "mk",
                "nl",
                "no",
                "pl",
                "pt",
                "pt-br",
                "sv",
                "sl",
                "tr"
               ],
               "optional": 1,
               "type": "string"
              },
              "kvm": {
               "default": 1,
               "description": "Enable/disable KVM hardware virtualization.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "localtime": {
               "description": "Set the real time clock (RTC) to local time. This is enabled by default if the `ostype` indicates a Microsoft Windows OS.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "lock": {
               "description": "Lock/unlock the VM.",
               "enum": [
                "backup",
                "clone",
                "create",
                "migrate",
                "rollback",
                "snapshot",
                "snapshot-delete",
                "suspending",
                "suspended"
               ],
               "optional": 1,
               "type": "string"
              },
              "machine": {
               "description": "Specify the QEMU machine.",
               "optional": 1,
               "type": "string",
               "typetext": "[[type=]<machine type>] [,enable-s3=<1|0>] [,enable-s4=<1|0>] [,viommu=<intel|virtio>]"
              },
              "memory": {
               "description": "Memory properties.",
               "optional": 1,
               "type": "string",
               "typetext": "[current=]<integer>"
              },
              "migrate_downtime": {
               "default": 0.1,
               "description": "Set maximum tolerated downtime (in seconds) for migrations. Should the migration not be able to converge in the very end, because too much newly dirtied RAM needs to be transferred, the limit will be increased automatically step-by-step until migration can converge.",
               "minimum": 0,
               "optional": 1,
               "type": "number",
               "typetext": "<number> (0 - N)"
              },
              "migrate_speed": {
               "default": 0,
               "description": "Set maximum speed (in MB/s) for migrations. Value 0 is no limit.",
               "minimum": 0,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (0 - N)"
              },
              "name": {
               "description": "Set a name for the VM. Only used on the configuration web interface.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "nameserver": {
               "description": "cloud-init: Sets DNS server IP address for a container. Create will automatically use the setting from the host if neither searchdomain nor nameserver are set.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "net[n]": {
               "description": "Specify network devices.",
               "optional": 1,
               "type": "string",
               "typetext": "[model=]<enum> [,bridge=<bridge>] [,firewall=<1|0>] [,link_down=<1|0>] [,macaddr=<XX:XX:XX:XX:XX:XX>] [,mtu=<integer>] [,queues=<integer>] [,rate=<number>] [,tag=<integer>] [,trunks=<vlanid[;vlanid...]>] [,<model>=<macaddr>]"
              },
              "node": {
               "description": "The cluster node name.",
               "type": "string",
               "typetext": "<string>"
              },
              "numa": {
               "default": 0,
               "description": "Enable/disable NUMA.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "numa[n]": {
               "description": "NUMA topology.",
               "optional": 1,
               "type": "string",
               "typetext": "cpus=<id[-id];...> [,hostnodes=<id[-id];...>] [,memory=<number>] [,policy=<preferred|bind|interleave>]"
              },
              "onboot": {
               "default": 0,
               "description": "Specifies whether a VM will be started during system bootup.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "ostype": {
               "description": "Specify guest operating system.",
               "enum": [
                "other",
                "wxp",
                "w2k",
                "w2k3",
                "w2k8",
                "wvista",
                "win7",
                "win8",
                "win10",
                "win11",
                "l24",
                "l26",
                "solaris"
               ],
               "optional": 1,
               "type": "string",
               "verbose_description": "Specify guest operating system. This is used to enable special\noptimization/features for specific operating systems:\n\n[horizontal]\nother;; unspecified OS\nwxp;; Microsoft Windows XP\nw2k;; Microsoft Windows 2000\nw2k3;; Microsoft Windows 2003\nw2k8;; Microsoft Windows 2008\nwvista;; Microsoft Windows Vista\nwin7;; Microsoft Windows 7\nwin8;; Microsoft Windows 8/2012/2012r2\nwin10;; Microsoft Windows 10/2016/2019\nwin11;; Microsoft Windows 11/2022/2025\nl24;; Linux 2.4 Kernel\nl26;; Linux 2.6 - 6.X Kernel\nsolaris;; Solaris/OpenSolaris/OpenIndiania kernel\n"
              },
              "parallel[n]": {
               "description": "Map host parallel devices (n is 0 to 2).",
               "optional": 1,
               "pattern": "/dev/parport\\d+|/dev/usb/lp\\d+",
               "type": "string",
               "verbose_description": "Map host parallel devices (n is 0 to 2).\n\nNOTE: This option allows direct access to host hardware. So it is no longer possible to migrate such\nmachines - use with special care.\n\nCAUTION: Experimental! User reported problems with this option.\n"
              },
              "protection": {
               "default": 0,
               "description": "Sets the protection flag of the VM. This will disable the remove VM and remove disk operations.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "reboot": {
               "default": 1,
               "description": "Allow reboot. If set to '0' the VM exit on reboot.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "revert": {
               "description": "Revert a pending change.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "rng0": {
               "description": "Configure a VirtIO-based Random Number Generator.",
               "optional": 1,
               "type": "string",
               "typetext": "[source=]</dev/urandom|/dev/random|/dev/hwrng> [,max_bytes=<integer>] [,period=<integer>]"
              },
              "sata[n]": {
               "description": "Use volume as SATA hard disk or CD-ROM (n is 0 to 5). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,ssd=<1|0>] [,trans=<none|lba|auto>] [,werror=<enum>] [,wwn=<wwn>]"
              },
              "scsi[n]": {
               "description": "Use volume as SCSI hard disk or CD-ROM (n is 0 to 30). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,iothread=<1|0>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,product=<product>] [,queues=<integer>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,ro=<1|0>] [,scsiblock=<1|0>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,ssd=<1|0>] [,trans=<none|lba|auto>] [,vendor=<vendor>] [,werror=<enum>] [,wwn=<wwn>]"
              },
              "scsihw": {
               "default": "lsi",
               "description": "SCSI controller model",
               "enum": [
                "lsi",
                "lsi53c810",
                "virtio-scsi-pci",
                "virtio-scsi-single",
                "megasas",
                "pvscsi"
               ],
               "optional": 1,
               "type": "string"
              },
              "searchdomain": {
               "description": "cloud-init: Sets DNS search domains for a container. Create will automatically use the setting from the host if neither searchdomain nor nameserver are set.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "serial[n]": {
               "description": "Create a serial device inside the VM (n is 0 to 3)",
               "optional": 1,
               "pattern": "(/dev/.+|socket)",
               "type": "string",
               "verbose_description": "Create a serial device inside the VM (n is 0 to 3), and pass through a\nhost serial device (i.e. /dev/ttyS0), or create a unix socket on the\nhost side (use 'qm terminal' to open a terminal connection).\n\nNOTE: If you pass through a host serial device, it is no longer possible to migrate such machines -\nuse with special care.\n\nCAUTION: Experimental! User reported problems with this option.\n"
              },
              "shares": {
               "default": 1000,
               "description": "Amount of memory shares for auto-ballooning. The larger the number is, the more memory this VM gets. Number is relative to weights of all other running VMs. Using zero disables auto-ballooning. Auto-ballooning is done by pvestatd.",
               "maximum": 50000,
               "minimum": 0,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (0 - 50000)"
              },
              "skiplock": {
               "description": "Ignore locks - only root is allowed to use this option.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "smbios1": {
               "description": "Specify SMBIOS type 1 fields.",
               "maxLength": 512,
               "optional": 1,
               "type": "string",
               "typetext": "[base64=<1|0>] [,family=<Base64 encoded string>] [,manufacturer=<Base64 encoded string>] [,product=<Base64 encoded string>] [,serial=<Base64 encoded string>] [,sku=<Base64 encoded string>] [,uuid=<UUID>] [,version=<Base64 encoded string>]"
              },
              "smp": {
               "default": 1,
               "description": "The number of CPUs. Please use option -sockets instead.",
               "minimum": 1,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (1 - N)"
              },
              "sockets": {
               "default": 1,
               "description": "The number of CPU sockets.",
               "minimum": 1,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (1 - N)"
              },
              "spice_enhancements": {
               "description": "Configure additional enhancements for SPICE.",
               "optional": 1,
               "type": "string",
               "typetext": "[foldersharing=<1|0>] [,videostreaming=<off|all|filter>]"
              },
              "sshkeys": {
               "description": "cloud-init: Setup public SSH keys (one key per line, OpenSSH format).",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "startdate": {
               "default": "now",
               "description": "Set the initial date of the real time clock. Valid format for date are:'now' or '2006-06-17T16:01:21' or '2006-06-17'.",
               "optional": 1,
               "pattern": "(now|\\d{4}-\\d{1,2}-\\d{1,2}(T\\d{1,2}:\\d{1,2}:\\d{1,2})?)",
               "type": "string",
               "typetext": "(now | YYYY-MM-DD | YYYY-MM-DDTHH:MM:SS)"
              },
              "startup": {
               "description": "Startup and shutdown behavior. Order is a non-negative number defining the general startup order. Shutdown in done with reverse ordering. Additionally you can set the 'up' or 'down' delay in seconds, which specifies a delay to wait before the next VM is started or stopped.",
               "optional": 1,
               "type": "string",
               "typetext": "[[order=]\\d+] [,up=\\d+] [,down=\\d+] "
              },
              "tablet": {
               "default": 1,
               "description": "Enable/disable the USB tablet device.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>",
               "verbose_description": "Enable/disable the USB tablet device. This device is usually needed to allow absolute mouse positioning with VNC. Else the mouse runs out of sync with normal VNC clients. If you're running lots of console-only guests on one host, you may consider disabling this to save some context switches. This is turned off by default if you use spice (`qm set <vmid> --vga qxl`)."
              },
              "tags": {
               "description": "Tags of the VM. This is only meta information.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "tdf": {
               "default": 0,
               "description": "Enable/disable time drift fix.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "template": {
               "default": 0,
               "description": "Enable/disable Template.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "tpmstate0": {
               "description": "Configure a Disk for storing TPM state. The format is fixed to 'raw'. Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Note that SIZE_IN_GiB is ignored here and 4 MiB will be used instead. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,import-from=<source volume>] [,size=<DiskSize>] [,version=<v1.2|v2.0>]"
              },
              "unused[n]": {
               "description": "Reference to unused volumes. This is used internally, and should not be modified manually.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume>"
              },
              "usb[n]": {
               "description": "Configure an USB device (n is 0 to 4, for machine version >= 7.1 and ostype l26 or windows > 7, n can be up to 14).",
               "optional": 1,
               "type": "string",
               "typetext": "[[host=]<HOSTUSBDEVICE|spice>] [,mapping=<mapping-id>] [,usb3=<1|0>]"
              },
              "vcpus": {
               "default": 0,
               "description": "Number of hotplugged vcpus.",
               "minimum": 1,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (1 - N)"
              },
              "vga": {
               "description": "Configure the VGA hardware.",
               "optional": 1,
               "type": "string",
               "typetext": "[[type=]<enum>] [,clipboard=<vnc>] [,memory=<integer>]",
               "verbose_description": "Configure the VGA Hardware. If you want to use high resolution modes (>= 1280x1024x16) you may need to increase the vga memory option. Since QEMU 2.9 the default VGA display type is 'std' for all OS types besides some Windows versions (XP and older) which use 'cirrus'. The 'qxl' option enables the SPICE display server. For win* OS you can select how many independent displays you want, Linux guests can add displays them self.\nYou can also run without any graphic card, using a serial device as terminal."
              },
              "virtio[n]": {
               "description": "Use volume as VIRTIO hard disk (n is 0 to 15). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,iothread=<1|0>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,ro=<1|0>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,trans=<none|lba|auto>] [,werror=<enum>]"
              },
              "virtiofs[n]": {
               "description": "Configuration for sharing a directory between host and guest using Virtio-fs.",
               "optional": 1,
               "type": "string",
               "typetext": "[dirid=]<mapping-id> [,cache=<enum>] [,direct-io=<1|0>] [,expose-acl=<1|0>] [,expose-xattr=<1|0>]"
              },
              "vmgenid": {
               "default": "1 (autogenerated)",
               "description": "Set VM Generation ID. Use '1' to autogenerate on create or update, pass '0' to disable explicitly.",
               "format_description": "UUID",
               "optional": 1,
               "pattern": "(?:[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}|[01])",
               "type": "string",
               "verbose_description": "The VM generation ID (vmgenid) device exposes a 128-bit integer value identifier to the guest OS. This allows to notify the guest operating system when the virtual machine is executed with a different configuration (e.g. snapshot execution or creation from a template). The guest operating system notices the change, and is then able to react as appropriate by marking its copies of distributed databases as dirty, re-initializing its random number generator, etc.\nNote that auto-creation only works when done through API/CLI create or update methods, but not when manually editing the config file."
              },
              "vmid": {
               "description": "The (unique) ID of the VM.",
               "maximum": 999999999,
               "minimum": 100,
               "type": "integer",
               "typetext": "<integer> (100 - 999999999)"
              },
              "vmstatestorage": {
               "description": "Default storage for VM state volumes/files.",
               "format_description": "storage ID",
               "optional": 1,
               "type": "string",
               "typetext": "<storage ID>"
              },
              "watchdog": {
               "description": "Create a virtual hardware watchdog device.",
               "optional": 1,
               "type": "string",
               "typetext": "[[model=]<i6300esb|ib700>] [,action=<enum>]",
               "verbose_description": "Create a virtual hardware watchdog device. Once enabled (by a guest action), the watchdog must be periodically polled by an agent inside the guest or else the watchdog will reset the guest (or execute the respective action specified)"
              }
             }
            },
            "permissions": {
             "check": [
              "perm",
              "/vms/{vmid}",
              [
               "VM.Config.Disk",
               "VM.Config.CDROM",
               "VM.Config.CPU",
               "VM.Config.Memory",
               "VM.Config.Network",
               "VM.Config.HWType",
               "VM.Config.Options",
               "VM.Config.Cloudinit"
              ],
              "any",
              1
             ]
            },
            "protected": 1,
            "proxyto": "node"
           },
           "PUT": {
            "allowtoken": 1,
            "description": "Set virtual machine options (synchronous API) - You should consider using the POST method instead for any actions involving hotplug or storage allocation.",
            "method": "PUT",
            "name": "update_vm",
            "parameters": {
             "additionalProperties": 0,
             "properties": {
              "acpi": {
               "default": 1,
               "description": "Enable/disable ACPI.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "affinity": {
               "description": "List of host cores used to execute guest processes, for example: 0,5,8-11",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "agent": {
               "description": "Enable/disable communication with the QEMU Guest Agent and its properties.",
               "optional": 1,
               "type": "string",
               "typetext": "[enabled=]<1|0> [,freeze-fs-on-backup=<1|0>] [,fstrim_cloned_disks=<1|0>] [,type=<virtio|isa>]"
              },
              "amd-sev": {
               "description": "Secure Encrypted Virtualization (SEV) features by AMD CPUs",
               "optional": 1,
               "type": "string",
               "typetext": "[type=]<sev-type> [,allow-smt=<1|0>] [,kernel-hashes=<1|0>] [,no-debug=<1|0>] [,no-key-sharing=<1|0>]"
              },
              "arch": {
               "description": "Virtual processor architecture. Defaults to the host.",
               "enum": [
                "x86_64",
                "aarch64"
               ],
               "optional": 1,
               "type": "string"
              },
              "args": {
               "description": "Arbitrary arguments passed to kvm.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>",
               "verbose_description": "Arbitrary arguments passed to kvm, for example:\n\nargs: -no-reboot -smbios 'type=0,vendor=FOO'\n\nNOTE: this option is for experts only.\n"
              },
              "audio0": {
               "description": "Configure a audio device, useful in combination with QXL/Spice.",
               "optional": 1,
               "type": "string",
               "typetext": "device=<ich9-intel-hda|intel-hda|AC97> [,driver=<spice|none>]"
              },
              "autostart": {
               "default": 0,
               "description": "Automatic restart after crash (currently ignored).",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "balloon": {
               "description": "Amount of target RAM for the VM in MiB. Using zero disables the ballon driver.",
               "minimum": 0,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (0 - N)"
              },
              "bios": {
               "default": "seabios",
               "description": "Select BIOS implementation.",
               "enum": [
                "seabios",
                "ovmf"
               ],
               "optional": 1,
               "type": "string"
              },
              "boot": {
               "description": "Specify guest boot order. Use the 'order=' sub-property as usage with no key or 'legacy=' is deprecated.",
               "optional": 1,
               "type": "string",
               "typetext": "[[legacy=]<[acdn]{1,4}>] [,order=<device[;device...]>]"
              },
              "bootdisk": {
               "description": "Enable booting from specified disk. Deprecated: Use 'boot: order=foo;bar' instead.",
               "optional": 1,
               "pattern": "(ide|sata|scsi|virtio)\\d+",
               "type": "string"
              },
              "cdrom": {
               "description": "This is an alias for option -ide2",
               "optional": 1,
               "type": "string",
               "typetext": "<volume>"
              },
              "cicustom": {
               "description": "cloud-init: Specify custom files to replace the automatically generated ones at start.",
               "optional": 1,
               "type": "string",
               "typetext": "[meta=<volume>] [,network=<volume>] [,user=<volume>] [,vendor=<volume>]"
              },
              "cipassword": {
               "description": "cloud-init: Password to assign the user. Using this is generally not recommended. Use ssh keys instead. Also note that older cloud-init versions do not support hashed passwords.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "citype": {
               "description": "Specifies the cloud-init configuration format. The default depends on the configured operating system type (`ostype`. We use the `nocloud` format for Linux, and `configdrive2` for windows.",
               "enum": [
                "configdrive2",
                "nocloud",
                "opennebula"
               ],
               "optional": 1,
               "type": "string"
              },
              "ciupgrade": {
               "default": 1,
               "description": "cloud-init: do an automatic package upgrade after the first boot.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "ciuser": {
               "description": "cloud-init: User name to change ssh keys and password for instead of the image's configured default user.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "cores": {
               "default": 1,
               "description": "The number of cores per socket.",
               "minimum": 1,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (1 - N)"
              },
              "cpu": {
               "description": "Emulated CPU type.",
               "optional": 1,
               "type": "string",
               "typetext": "[[cputype=]<string>] [,flags=<+FLAG[;-FLAG...]>] [,hidden=<1|0>] [,hv-vendor-id=<vendor-id>] [,phys-bits=<8-64|host>] [,reported-model=<enum>]"
              },
              "cpulimit": {
               "default": 0,
               "description": "Limit of CPU usage.",
               "maximum": 128,
               "minimum": 0,
               "optional": 1,
               "type": "number",
               "typetext": "<number> (0 - 128)",
               "verbose_description": "Limit of CPU usage.\n\nNOTE: If the computer has 2 CPUs, it has total of '2' CPU time. Value '0' indicates no CPU limit."
              },
              "cpuunits": {
               "default": "cgroup v1: 1024, cgroup v2: 100",
               "description": "CPU weight for a VM, will be clamped to [1, 10000] in cgroup v2.",
               "maximum": 262144,
               "minimum": 1,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (1 - 262144)",
               "verbose_description": "CPU weight for a VM. Argument is used in the kernel fair scheduler. The larger the number is, the more CPU time this VM gets. Number is relative to weights of all the other running VMs."
              },
              "delete": {
               "description": "A list of settings you want to delete.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "description": {
               "description": "Description for the VM. Shown in the web-interface VM's summary. This is saved as comment inside the configuration file.",
               "maxLength": 8192,
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "digest": {
               "description": "Prevent changes if current configuration file has different SHA1 digest. This can be used to prevent concurrent modifications.",
               "maxLength": 40,
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "efidisk0": {
               "description": "Configure a disk for storing EFI vars. Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Note that SIZE_IN_GiB is ignored here and that the default EFI vars are copied to the volume instead. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,efitype=<2m|4m>] [,format=<enum>] [,import-from=<source volume>] [,ms-cert=<enum>] [,pre-enrolled-keys=<1|0>] [,size=<DiskSize>]"
              },
              "force": {
               "description": "Force physical removal. Without this, we simple remove the disk from the config file and create an additional configuration entry called 'unused[n]', which contains the volume ID. Unlink of unused[n] always cause physical removal.",
               "optional": 1,
               "requires": "delete",
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "freeze": {
               "description": "Freeze CPU at startup (use 'c' monitor command to start execution).",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "hookscript": {
               "description": "Script that will be executed during various steps in the vms lifetime.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "hostpci[n]": {
               "description": "Map host PCI devices into guest.",
               "optional": 1,
               "type": "string",
               "typetext": "[[host=]<HOSTPCIID[;HOSTPCIID2...]>] [,device-id=<hex id>] [,legacy-igd=<1|0>] [,mapping=<mapping-id>] [,mdev=<string>] [,pcie=<1|0>] [,rombar=<1|0>] [,romfile=<string>] [,sub-device-id=<hex id>] [,sub-vendor-id=<hex id>] [,vendor-id=<hex id>] [,x-vga=<1|0>]",
               "verbose_description": "Map host PCI devices into guest.\n\nNOTE: This option allows direct access to host hardware. So it is no longer\npossible to migrate such machines - use with special care.\n\nCAUTION: Experimental! User reported problems with this option.\n"
              },
              "hotplug": {
               "default": "network,disk,usb",
               "description": "Selectively enable hotplug features. This is a comma separated list of hotplug features: 'network', 'disk', 'cpu', 'memory', 'usb' and 'cloudinit'. Use '0' to disable hotplug completely. Using '1' as value is an alias for the default `network,disk,usb`. USB hotplugging is possible for guests with machine version >= 7.1 and ostype l26 or windows > 7.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "hugepages": {
               "description": "Enable/disable hugepages memory.",
               "enum": [
                "any",
                "2",
                "1024"
               ],
               "optional": 1,
               "type": "string"
              },
              "ide[n]": {
               "description": "Use volume as IDE hard disk or CD-ROM (n is 0 to 3). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,model=<model>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,ssd=<1|0>] [,trans=<none|lba|auto>] [,werror=<enum>] [,wwn=<wwn>]"
              },
              "ipconfig[n]": {
               "description": "cloud-init: Specify IP addresses and gateways for the corresponding interface.\n\nIP addresses use CIDR notation, gateways are optional but need an IP of the same type specified.\n\nThe special string 'dhcp' can be used for IP addresses to use DHCP, in which case no explicit\ngateway should be provided.\nFor IPv6 the special string 'auto' can be used to use stateless autoconfiguration. This requires\ncloud-init 19.4 or newer.\n\nIf cloud-init is enabled and neither an IPv4 nor an IPv6 address is specified, it defaults to using\ndhcp on IPv4.\n",
               "optional": 1,
               "type": "string",
               "typetext": "[gw=<GatewayIPv4>] [,gw6=<GatewayIPv6>] [,ip=<IPv4Format/CIDR>] [,ip6=<IPv6Format/CIDR>]"
              },
              "ivshmem": {
               "description": "Inter-VM shared memory. Useful for direct communication between VMs, or to the host.",
               "optional": 1,
               "type": "string",
               "typetext": "size=<integer> [,name=<string>]"
              },
              "keephugepages": {
               "default": 0,
               "description": "Use together with hugepages. If enabled, hugepages will not not be deleted after VM shutdown and can be used for subsequent starts.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "keyboard": {
               "default": null,
               "description": "Keyboard layout for VNC server. This option is generally not required and is often better handled from within the guest OS.",
               "enum": [
                "de",
                "de-ch",
                "da",
                "en-gb",
                "en-us",
                "es",
                "fi",
                "fr",
                "fr-be",
                "fr-ca",
                "fr-ch",
                "hu",
                "is",
                "it",
                "ja",
                "lt",
                "mk",
                "nl",
                "no",
                "pl",
                "pt",
                "pt-br",
                "sv",
                "sl",
                "tr"
               ],
               "optional": 1,
               "type": "string"
              },
              "kvm": {
               "default": 1,
               "description": "Enable/disable KVM hardware virtualization.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "localtime": {
               "description": "Set the real time clock (RTC) to local time. This is enabled by default if the `ostype` indicates a Microsoft Windows OS.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "lock": {
               "description": "Lock/unlock the VM.",
               "enum": [
                "backup",
                "clone",
                "create",
                "migrate",
                "rollback",
                "snapshot",
                "snapshot-delete",
                "suspending",
                "suspended"
               ],
               "optional": 1,
               "type": "string"
              },
              "machine": {
               "description": "Specify the QEMU machine.",
               "optional": 1,
               "type": "string",
               "typetext": "[[type=]<machine type>] [,enable-s3=<1|0>] [,enable-s4=<1|0>] [,viommu=<intel|virtio>]"
              },
              "memory": {
               "description": "Memory properties.",
               "optional": 1,
               "type": "string",
               "typetext": "[current=]<integer>"
              },
              "migrate_downtime": {
               "default": 0.1,
               "description": "Set maximum tolerated downtime (in seconds) for migrations. Should the migration not be able to converge in the very end, because too much newly dirtied RAM needs to be transferred, the limit will be increased automatically step-by-step until migration can converge.",
               "minimum": 0,
               "optional": 1,
               "type": "number",
               "typetext": "<number> (0 - N)"
              },
              "migrate_speed": {
               "default": 0,
               "description": "Set maximum speed (in MB/s) for migrations. Value 0 is no limit.",
               "minimum": 0,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (0 - N)"
              },
              "name": {
               "description": "Set a name for the VM. Only used on the configuration web interface.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "nameserver": {
               "description": "cloud-init: Sets DNS server IP address for a container. Create will automatically use the setting from the host if neither searchdomain nor nameserver are set.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "net[n]": {
               "description": "Specify network devices.",
               "optional": 1,
               "type": "string",
               "typetext": "[model=]<enum> [,bridge=<bridge>] [,firewall=<1|0>] [,link_down=<1|0>] [,macaddr=<XX:XX:XX:XX:XX:XX>] [,mtu=<integer>] [,queues=<integer>] [,rate=<number>] [,tag=<integer>] [,trunks=<vlanid[;vlanid...]>] [,<model>=<macaddr>]"
              },
              "node": {
               "description": "The cluster node name.",
               "type": "string",
               "typetext": "<string>"
              },
              "numa": {
               "default": 0,
               "description": "Enable/disable NUMA.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "numa[n]": {
               "description": "NUMA topology.",
               "optional": 1,
               "type": "string",
               "typetext": "cpus=<id[-id];...> [,hostnodes=<id[-id];...>] [,memory=<number>] [,policy=<preferred|bind|interleave>]"
              },
              "onboot": {
               "default": 0,
               "description": "Specifies whether a VM will be started during system bootup.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "ostype": {
               "description": "Specify guest operating system.",
               "enum": [
                "other",
                "wxp",
                "w2k",
                "w2k3",
                "w2k8",
                "wvista",
                "win7",
                "win8",
                "win10",
                "win11",
                "l24",
                "l26",
                "solaris"
               ],
               "optional": 1,
               "type": "string",
               "verbose_description": "Specify guest operating system. This is used to enable special\noptimization/features for specific operating systems:\n\n[horizontal]\nother;; unspecified OS\nwxp;; Microsoft Windows XP\nw2k;; Microsoft Windows 2000\nw2k3;; Microsoft Windows 2003\nw2k8;; Microsoft Windows 2008\nwvista;; Microsoft Windows Vista\nwin7;; Microsoft Windows 7\nwin8;; Microsoft Windows 8/2012/2012r2\nwin10;; Microsoft Windows 10/2016/2019\nwin11;; Microsoft Windows 11/2022/2025\nl24;; Linux 2.4 Kernel\nl26;; Linux 2.6 - 6.X Kernel\nsolaris;; Solaris/OpenSolaris/OpenIndiania kernel\n"
              },
              "parallel[n]": {
               "description": "Map host parallel devices (n is 0 to 2).",
               "optional": 1,
               "pattern": "/dev/parport\\d+|/dev/usb/lp\\d+",
               "type": "string",
               "verbose_description": "Map host parallel devices (n is 0 to 2).\n\nNOTE: This option allows direct access to host hardware. So it is no longer possible to migrate such\nmachines - use with special care.\n\nCAUTION: Experimental! User reported problems with this option.\n"
              },
              "protection": {
               "default": 0,
               "description": "Sets the protection flag of the VM. This will disable the remove VM and remove disk operations.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "reboot": {
               "default": 1,
               "description": "Allow reboot. If set to '0' the VM exit on reboot.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "revert": {
               "description": "Revert a pending change.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "rng0": {
               "description": "Configure a VirtIO-based Random Number Generator.",
               "optional": 1,
               "type": "string",
               "typetext": "[source=]</dev/urandom|/dev/random|/dev/hwrng> [,max_bytes=<integer>] [,period=<integer>]"
              },
              "sata[n]": {
               "description": "Use volume as SATA hard disk or CD-ROM (n is 0 to 5). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,ssd=<1|0>] [,trans=<none|lba|auto>] [,werror=<enum>] [,wwn=<wwn>]"
              },
              "scsi[n]": {
               "description": "Use volume as SCSI hard disk or CD-ROM (n is 0 to 30). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,iothread=<1|0>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,product=<product>] [,queues=<integer>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,ro=<1|0>] [,scsiblock=<1|0>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,ssd=<1|0>] [,trans=<none|lba|auto>] [,vendor=<vendor>] [,werror=<enum>] [,wwn=<wwn>]"
              },
              "scsihw": {
               "default": "lsi",
               "description": "SCSI controller model",
               "enum": [
                "lsi",
                "lsi53c810",
                "virtio-scsi-pci",
                "virtio-scsi-single",
                "megasas",
                "pvscsi"
               ],
               "optional": 1,
               "type": "string"
              },
              "searchdomain": {
               "description": "cloud-init: Sets DNS search domains for a container. Create will automatically use the setting from the host if neither searchdomain nor nameserver are set.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "serial[n]": {
               "description": "Create a serial device inside the VM (n is 0 to 3)",
               "optional": 1,
               "pattern": "(/dev/.+|socket)",
               "type": "string",
               "verbose_description": "Create a serial device inside the VM (n is 0 to 3), and pass through a\nhost serial device (i.e. /dev/ttyS0), or create a unix socket on the\nhost side (use 'qm terminal' to open a terminal connection).\n\nNOTE: If you pass through a host serial device, it is no longer possible to migrate such machines -\nuse with special care.\n\nCAUTION: Experimental! User reported problems with this option.\n"
              },
              "shares": {
               "default": 1000,
               "description": "Amount of memory shares for auto-ballooning. The larger the number is, the more memory this VM gets. Number is relative to weights of all other running VMs. Using zero disables auto-ballooning. Auto-ballooning is done by pvestatd.",
               "maximum": 50000,
               "minimum": 0,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (0 - 50000)"
              },
              "skiplock": {
               "description": "Ignore locks - only root is allowed to use this option.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "smbios1": {
               "description": "Specify SMBIOS type 1 fields.",
               "maxLength": 512,
               "optional": 1,
               "type": "string",
               "typetext": "[base64=<1|0>] [,family=<Base64 encoded string>] [,manufacturer=<Base64 encoded string>] [,product=<Base64 encoded string>] [,serial=<Base64 encoded string>] [,sku=<Base64 encoded string>] [,uuid=<UUID>] [,version=<Base64 encoded string>]"
              },
              "smp": {
               "default": 1,
               "description": "The number of CPUs. Please use option -sockets instead.",
               "minimum": 1,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (1 - N)"
              },
              "sockets": {
               "default": 1,
               "description": "The number of CPU sockets.",
               "minimum": 1,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (1 - N)"
              },
              "spice_enhancements": {
               "description": "Configure additional enhancements for SPICE.",
               "optional": 1,
               "type": "string",
               "typetext": "[foldersharing=<1|0>] [,videostreaming=<off|all|filter>]"
              },
              "sshkeys": {
               "description": "cloud-init: Setup public SSH keys (one key per line, OpenSSH format).",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "startdate": {
               "default": "now",
               "description": "Set the initial date of the real time clock. Valid format for date are:'now' or '2006-06-17T16:01:21' or '2006-06-17'.",
               "optional": 1,
               "pattern": "(now|\\d{4}-\\d{1,2}-\\d{1,2}(T\\d{1,2}:\\d{1,2}:\\d{1,2})?)",
               "type": "string",
               "typetext": "(now | YYYY-MM-DD | YYYY-MM-DDTHH:MM:SS)"
              },
              "startup": {
               "description": "Startup and shutdown behavior. Order is a non-negative number defining the general startup order. Shutdown in done with reverse ordering. Additionally you can set the 'up' or 'down' delay in seconds, which specifies a delay to wait before the next VM is started or stopped.",
               "optional": 1,
               "type": "string",
               "typetext": "[[order=]\\d+] [,up=\\d+] [,down=\\d+] "
              },
              "tablet": {
               "default": 1,
               "description": "Enable/disable the USB tablet device.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>",
               "verbose_description": "Enable/disable the USB tablet device. This device is usually needed to allow absolute mouse positioning with VNC. Else the mouse runs out of sync with normal VNC clients. If you're running lots of console-only guests on one host, you may consider disabling this to save some context switches. This is turned off by default if you use spice (`qm set <vmid> --vga qxl`)."
              },
              "tags": {
               "description": "Tags of the VM. This is only meta information.",
               "optional": 1,
               "type": "string",
               "typetext": "<string>"
              },
              "tdf": {
               "default": 0,
               "description": "Enable/disable time drift fix.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "template": {
               "default": 0,
               "description": "Enable/disable Template.",
               "optional": 1,
               "type": "boolean",
               "typetext": "<boolean>"
              },
              "tpmstate0": {
               "description": "Configure a Disk for storing TPM state. The format is fixed to 'raw'. Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Note that SIZE_IN_GiB is ignored here and 4 MiB will be used instead. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,import-from=<source volume>] [,size=<DiskSize>] [,version=<v1.2|v2.0>]"
              },
              "unused[n]": {
               "description": "Reference to unused volumes. This is used internally, and should not be modified manually.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume>"
              },
              "usb[n]": {
               "description": "Configure an USB device (n is 0 to 4, for machine version >= 7.1 and ostype l26 or windows > 7, n can be up to 14).",
               "optional": 1,
               "type": "string",
               "typetext": "[[host=]<HOSTUSBDEVICE|spice>] [,mapping=<mapping-id>] [,usb3=<1|0>]"
              },
              "vcpus": {
               "default": 0,
               "description": "Number of hotplugged vcpus.",
               "minimum": 1,
               "optional": 1,
               "type": "integer",
               "typetext": "<integer> (1 - N)"
              },
              "vga": {
               "description": "Configure the VGA hardware.",
               "optional": 1,
               "type": "string",
               "typetext": "[[type=]<enum>] [,clipboard=<vnc>] [,memory=<integer>]",
               "verbose_description": "Configure the VGA Hardware. If you want to use high resolution modes (>= 1280x1024x16) you may need to increase the vga memory option. Since QEMU 2.9 the default VGA display type is 'std' for all OS types besides some Windows versions (XP and older) which use 'cirrus'. The 'qxl' option enables the SPICE display server. For win* OS you can select how many independent displays you want, Linux guests can add displays them self.\nYou can also run without any graphic card, using a serial device as terminal."
              },
              "virtio[n]": {
               "description": "Use volume as VIRTIO hard disk (n is 0 to 15). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
               "optional": 1,
               "type": "string",
               "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,iothread=<1|0>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,ro=<1|0>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,trans=<none|lba|auto>] [,werror=<enum>]"
              },
              "virtiofs[n]": {
               "description": "Configuration for sharing a directory between host and guest using Virtio-fs.",
               "optional": 1,
               "type": "string",
               "typetext": "[dirid=]<mapping-id> [,cache=<enum>] [,direct-io=<1|0>] [,expose-acl=<1|0>] [,expose-xattr=<1|0>]"
              },
              "vmgenid": {
               "default": "1 (autogenerated)",
               "description": "Set VM Generation ID. Use '1' to autogenerate on create or update, pass '0' to disable explicitly.",
               "format_description": "UUID",
               "optional": 1,
               "pattern": "(?:[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}|[01])",
               "type": "string",
               "verbose_description": "The VM generation ID (vmgenid) device exposes a 128-bit integer value identifier to the guest OS. This allows to notify the guest operating system when the virtual machine is executed with a different configuration (e.g. snapshot execution or creation from a template). The guest operating system notices the change, and is then able to react as appropriate by marking its copies of distributed databases as dirty, re-initializing its random number generator, etc.\nNote that auto-creation only works when done through API/CLI create or update methods, but not when manually editing the config file."
              },
              "vmid": {
               "description": "The (unique) ID of the VM.",
               "maximum": 999999999,
               "minimum": 100,
               "type": "integer",
               "typetext": "<integer> (100 - 999999999)"
              },
              "vmstatestorage": {
               "description": "Default storage for VM state volumes/files.",
               "format_description": "storage ID",
               "optional": 1,
               "type": "string",
               "typetext": "<storage ID>"
              },
              "watchdog": {
               "description": "Create a virtual hardware watchdog device.",
               "optional": 1,
               "type": "string",
               "typetext": "[[model=]<i6300esb|ib700>] [,action=<enum>]",
               "verbose_description": "Create a virtual hardware watchdog device. Once enabled (by a guest action), the watchdog must be periodically polled by an agent inside the guest or else the watchdog will reset the guest (or execute the respective action specified)"
              }
             }
            },
            "permissions": {
             "check": [
              "perm",
              "/vms/{vmid}",
              [
               "VM.Config.Disk",
               "VM.Config.CDROM",
               "VM.Config.CPU",
               "VM.Config.Memory",
               "VM.Config.Network",
               "VM.Config.HWType",
               "VM.Config.Options",
               "VM.Config.Cloudinit"
              ],
              "any",
              1
             ]
            },
            "protected": 1,
            "proxyto": "node"
           }
          },
          "leaf": 1,
          "path": "/nodes/{node}/qemu/{vmid}/config",
          "text": "config"
         },
         {
          "children": [
           {
            "info": {
             "GET": {
              "allowtoken": 1,
              "description": "Get virtual machine status.",
              "method": "GET",
              "name": "vm_status",
              "parameters": {
               "additionalProperties": 0,
               "properties": {
                "node": {
                 "description": "The cluster node name.",
                 "type": "string",
                 "typetext": "<string>"
                },
                "vmid": {
                 "description": "The (unique) ID of the VM.",
                 "maximum": 999999999,
                 "minimum": 100,
                 "type": "integer",
                 "typetext": "<integer> (100 - 999999999)"
                }
               }
              },
              "permissions": {
               "check": [
                "perm",
                "/vms/{vmid}",
                [
                 "VM.Audit"
                ]
               ]
              },
              "protected": 1,
              "proxyto": "node"
             }
            },
            "leaf": 1,
            "path": "/nodes/{node}/qemu/{vmid}/status/current",
            "text": "current"
           },
           {
            "info": {
             "POST": {
              "allowtoken": 1,
              "description": "Stop virtual machine. The qemu process will exit immediately. This is akin to pulling the power plug of a running computer and may damage the VM data.",
              "method": "POST",
              "name": "vm_stop",
              "parameters": {
               "additionalProperties": 0,
               "properties": {
                "keepActive": {
                 "default": 0,
                 "description": "Do not deactivate storage volumes.",
                 "optional": 1,
                 "type": "boolean",
                 "typetext": "<boolean>"
                },
                "migratedfrom": {
                 "description": "The cluster node name.",
                 "optional": 1,
                 "type": "string",
                 "typetext": "<string>"
                },
                "node": {
                 "description": "The cluster node name.",
                 "type": "string",
                 "typetext": "<string>"
                },
                "overrule-shutdown": {
                 "default": 0,
                 "description": "Try to abort active 'qmshutdown' tasks before stopping.",
                 "optional": 1,
                 "type": "boolean",
                 "typetext": "<boolean>"
                },
                "skiplock": {
                 "description": "Ignore locks - only root is allowed to use this option.",
                 "optional": 1,
                 "type": "boolean",
                 "typetext": "<boolean>"
                },
                "timeout": {
                 "description": "Wait maximal timeout seconds.",
                 "minimum": 0,
                 "optional": 1,
                 "type": "integer",
                 "typetext": "<integer> (0 - N)"
                },
                "vmid": {
                 "description": "The (unique) ID of the VM.",
                 "maximum": 999999999,
                 "minimum": 100,
                 "type": "integer",
                 "typetext": "<integer> (100 - 999999999)"
                }
               }
              },
              "permissions": {
               "check": [
                "perm",
                "/vms/{vmid}",
                [
                 "VM.PowerMgmt"
                ]
               ]
              },
              "protected": 1,
              "proxyto": "node"
             }
            },
            "leaf": 1,
            "path": "/nodes/{node}/qemu/{vmid}/status/stop",
            "text": "stop"
           }
          ],
          "leaf": 0,
          "path": "/nodes/{node}/qemu/{vmid}/status",
          "text": "status"
         }
        ],
        "leaf": 0,
        "path": "/nodes/{node}/qemu/{vmid}",
        "text": "{vmid}"
       }
      ],
      "info": {
       "GET": {
        "allowtoken": 1,
        "description": "Virtual machine index (per node).",
        "method": "GET",
        "name": "vmlist",
        "parameters": {
         "additionalProperties": 0,
         "properties": {
          "full": {
           "description": "Determine the full status of active VMs.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "node": {
           "description": "The cluster node name.",
           "type": "string",
           "typetext": "<string>"
          }
         }
        },
        "permissions": {
         "description": "Only list VMs where you have VM.Audit permissions on /vms/<vmid>.",
         "user": "all"
        },
        "protected": 1,
        "proxyto": "node"
       },
       "POST": {
        "allowtoken": 1,
        "description": "Create or restore a virtual machine.",
        "method": "POST",
        "name": "create_vm",
        "parameters": {
         "additionalProperties": 0,
         "properties": {
          "acpi": {
           "default": 1,
           "description": "Enable/disable ACPI.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "affinity": {
           "description": "List of host cores used to execute guest processes, for example: 0,5,8-11",
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "agent": {
           "description": "Enable/disable communication with the QEMU Guest Agent and its properties.",
           "optional": 1,
           "type": "string",
           "typetext": "[enabled=]<1|0> [,freeze-fs-on-backup=<1|0>] [,fstrim_cloned_disks=<1|0>] [,type=<virtio|isa>]"
          },
          "amd-sev": {
           "description": "Secure Encrypted Virtualization (SEV) features by AMD CPUs",
           "optional": 1,
           "type": "string",
           "typetext": "[type=]<sev-type> [,allow-smt=<1|0>] [,kernel-hashes=<1|0>] [,no-debug=<1|0>] [,no-key-sharing=<1|0>]"
          },
          "arch": {
           "description": "Virtual processor architecture. Defaults to the host.",
           "enum": [
            "x86_64",
            "aarch64"
           ],
           "optional": 1,
           "type": "string"
          },
          "archive": {
           "description": "The backup archive. Either the file system path to a .tar or .vma file (use '-' to pipe data from stdin) or a proxmox storage backup volume identifier.",
           "maxLength": 255,
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "args": {
           "description": "Arbitrary arguments passed to kvm.",
           "optional": 1,
           "type": "string",
           "typetext": "<string>",
           "verbose_description": "Arbitrary arguments passed to kvm, for example:\n\nargs: -no-reboot -smbios 'type=0,vendor=FOO'\n\nNOTE: this option is for experts only.\n"
          },
          "audio0": {
           "description": "Configure a audio device, useful in combination with QXL/Spice.",
           "optional": 1,
           "type": "string",
           "typetext": "device=<ich9-intel-hda|intel-hda|AC97> [,driver=<spice|none>]"
          },
          "autostart": {
           "default": 0,
           "description": "Automatic restart after crash (currently ignored).",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "balloon": {
           "description": "Amount of target RAM for the VM in MiB. Using zero disables the ballon driver.",
           "minimum": 0,
           "optional": 1,
           "type": "integer",
           "typetext": "<integer> (0 - N)"
          },
          "bios": {
           "default": "seabios",
           "description": "Select BIOS implementation.",
           "enum": [
            "seabios",
            "ovmf"
           ],
           "optional": 1,
           "type": "string"
          },
          "boot": {
           "description": "Specify guest boot order. Use the 'order=' sub-property as usage with no key or 'legacy=' is deprecated.",
           "optional": 1,
           "type": "string",
           "typetext": "[[legacy=]<[acdn]{1,4}>] [,order=<device[;device...]>]"
          },
          "bootdisk": {
           "description": "Enable booting from specified disk. Deprecated: Use 'boot: order=foo;bar' instead.",
           "optional": 1,
           "pattern": "(ide|sata|scsi|virtio)\\d+",
           "type": "string"
          },
          "bwlimit": {
           "default": "restore limit from datacenter or storage config",
           "description": "Override I/O bandwidth limit (in KiB/s).",
           "minimum": "0",
           "optional": 1,
           "type": "integer",
           "typetext": "<integer> (0 - N)"
          },
          "cdrom": {
           "description": "This is an alias for option -ide2",
           "optional": 1,
           "type": "string",
           "typetext": "<volume>"
          },
          "cicustom": {
           "description": "cloud-init: Specify custom files to replace the automatically generated ones at start.",
           "optional": 1,
           "type": "string",
           "typetext": "[meta=<volume>] [,network=<volume>] [,user=<volume>] [,vendor=<volume>]"
          },
          "cipassword": {
           "description": "cloud-init: Password to assign the user. Using this is generally not recommended. Use ssh keys instead. Also note that older cloud-init versions do not support hashed passwords.",
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "citype": {
           "description": "Specifies the cloud-init configuration format. The default depends on the configured operating system type (`ostype`. We use the `nocloud` format for Linux, and `configdrive2` for windows.",
           "enum": [
            "configdrive2",
            "nocloud",
            "opennebula"
           ],
           "optional": 1,
           "type": "string"
          },
          "ciupgrade": {
           "default": 1,
           "description": "cloud-init: do an automatic package upgrade after the first boot.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "ciuser": {
           "description": "cloud-init: User name to change ssh keys and password for instead of the image's configured default user.",
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "cores": {
           "default": 1,
           "description": "The number of cores per socket.",
           "minimum": 1,
           "optional": 1,
           "type": "integer",
           "typetext": "<integer> (1 - N)"
          },
          "cpu": {
           "description": "Emulated CPU type.",
           "optional": 1,
           "type": "string",
           "typetext": "[[cputype=]<string>] [,flags=<+FLAG[;-FLAG...]>] [,hidden=<1|0>] [,hv-vendor-id=<vendor-id>] [,phys-bits=<8-64|host>] [,reported-model=<enum>]"
          },
          "cpulimit": {
           "default": 0,
           "description": "Limit of CPU usage.",
           "maximum": 128,
           "minimum": 0,
           "optional": 1,
           "type": "number",
           "typetext": "<number> (0 - 128)",
           "verbose_description": "Limit of CPU usage.\n\nNOTE: If the computer has 2 CPUs, it has total of '2' CPU time. Value '0' indicates no CPU limit."
          },
          "cpuunits": {
           "default": "cgroup v1: 1024, cgroup v2: 100",
           "description": "CPU weight for a VM, will be clamped to [1, 10000] in cgroup v2.",
           "maximum": 262144,
           "minimum": 1,
           "optional": 1,
           "type": "integer",
           "typetext": "<integer> (1 - 262144)",
           "verbose_description": "CPU weight for a VM. Argument is used in the kernel fair scheduler. The larger the number is, the more CPU time this VM gets. Number is relative to weights of all the other running VMs."
          },
          "description": {
           "description": "Description for the VM. Shown in the web-interface VM's summary. This is saved as comment inside the configuration file.",
           "maxLength": 8192,
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "efidisk0": {
           "description": "Configure a disk for storing EFI vars. Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Note that SIZE_IN_GiB is ignored here and that the default EFI vars are copied to the volume instead. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
           "optional": 1,
           "type": "string",
           "typetext": "[file=]<volume> [,efitype=<2m|4m>] [,format=<enum>] [,import-from=<source volume>] [,ms-cert=<enum>] [,pre-enrolled-keys=<1|0>] [,size=<DiskSize>]"
          },
          "force": {
           "description": "Allow to overwrite existing VM.",
           "optional": 1,
           "requires": "archive",
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "freeze": {
           "description": "Freeze CPU at startup (use 'c' monitor command to start execution).",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "hookscript": {
           "description": "Script that will be executed during various steps in the vms lifetime.",
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "hostpci[n]": {
           "description": "Map host PCI devices into guest.",
           "optional": 1,
           "type": "string",
           "typetext": "[[host=]<HOSTPCIID[;HOSTPCIID2...]>] [,device-id=<hex id>] [,legacy-igd=<1|0>] [,mapping=<mapping-id>] [,mdev=<string>] [,pcie=<1|0>] [,rombar=<1|0>] [,romfile=<string>] [,sub-device-id=<hex id>] [,sub-vendor-id=<hex id>] [,vendor-id=<hex id>] [,x-vga=<1|0>]",
           "verbose_description": "Map host PCI devices into guest.\n\nNOTE: This option allows direct access to host hardware. So it is no longer\npossible to migrate such machines - use with special care.\n\nCAUTION: Experimental! User reported problems with this option.\n"
          },
          "hotplug": {
           "default": "network,disk,usb",
           "description": "Selectively enable hotplug features. This is a comma separated list of hotplug features: 'network', 'disk', 'cpu', 'memory', 'usb' and 'cloudinit'. Use '0' to disable hotplug completely. Using '1' as value is an alias for the default `network,disk,usb`. USB hotplugging is possible for guests with machine version >= 7.1 and ostype l26 or windows > 7.",
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "hugepages": {
           "description": "Enable/disable hugepages memory.",
           "enum": [
            "any",
            "2",
            "1024"
           ],
           "optional": 1,
           "type": "string"
          },
          "ide[n]": {
           "description": "Use volume as IDE hard disk or CD-ROM (n is 0 to 3). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
           "optional": 1,
           "type": "string",
           "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,model=<model>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,ssd=<1|0>] [,trans=<none|lba|auto>] [,werror=<enum>] [,wwn=<wwn>]"
          },
          "import-working-storage": {
           "description": "A file-based storage with 'images' content-type enabled, which is used as an intermediary extraction storage during import. Defaults to the source storage.",
           "format_description": "storage ID",
           "optional": 1,
           "type": "string",
           "typetext": "<storage ID>"
          },
          "ipconfig[n]": {
           "description": "cloud-init: Specify IP addresses and gateways for the corresponding interface.\n\nIP addresses use CIDR notation, gateways are optional but need an IP of the same type specified.\n\nThe special string 'dhcp' can be used for IP addresses to use DHCP, in which case no explicit\ngateway should be provided.\nFor IPv6 the special string 'auto' can be used to use stateless autoconfiguration. This requires\ncloud-init 19.4 or newer.\n\nIf cloud-init is enabled and neither an IPv4 nor an IPv6 address is specified, it defaults to using\ndhcp on IPv4.\n",
           "optional": 1,
           "type": "string",
           "typetext": "[gw=<GatewayIPv4>] [,gw6=<GatewayIPv6>] [,ip=<IPv4Format/CIDR>] [,ip6=<IPv6Format/CIDR>]"
          },
          "ivshmem": {
           "description": "Inter-VM shared memory. Useful for direct communication between VMs, or to the host.",
           "optional": 1,
           "type": "string",
           "typetext": "size=<integer> [,name=<string>]"
          },
          "keephugepages": {
           "default": 0,
           "description": "Use together with hugepages. If enabled, hugepages will not not be deleted after VM shutdown and can be used for subsequent starts.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "keyboard": {
           "default": null,
           "description": "Keyboard layout for VNC server. This option is generally not required and is often better handled from within the guest OS.",
           "enum": [
            "de",
            "de-ch",
            "da",
            "en-gb",
            "en-us",
            "es",
            "fi",
            "fr",
            "fr-be",
            "fr-ca",
            "fr-ch",
            "hu",
            "is",
            "it",
            "ja",
            "lt",
            "mk",
            "nl",
            "no",
            "pl",
            "pt",
            "pt-br",
            "sv",
            "sl",
            "tr"
           ],
           "optional": 1,
           "type": "string"
          },
          "kvm": {
           "default": 1,
           "description": "Enable/disable KVM hardware virtualization.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "live-restore": {
           "description": "Start the VM immediately while importing or restoring in the background.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "localtime": {
           "description": "Set the real time clock (RTC) to local time. This is enabled by default if the `ostype` indicates a Microsoft Windows OS.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "lock": {
           "description": "Lock/unlock the VM.",
           "enum": [
            "backup",
            "clone",
            "create",
            "migrate",
            "rollback",
            "snapshot",
            "snapshot-delete",
            "suspending",
            "suspended"
           ],
           "optional": 1,
           "type": "string"
          },
          "machine": {
           "description": "Specify the QEMU machine.",
           "optional": 1,
           "type": "string",
           "typetext": "[[type=]<machine type>] [,enable-s3=<1|0>] [,enable-s4=<1|0>] [,viommu=<intel|virtio>]"
          },
          "memory": {
           "description": "Memory properties.",
           "optional": 1,
           "type": "string",
           "typetext": "[current=]<integer>"
          },
          "migrate_downtime": {
           "default": 0.1,
           "description": "Set maximum tolerated downtime (in seconds) for migrations. Should the migration not be able to converge in the very end, because too much newly dirtied RAM needs to be transferred, the limit will be increased automatically step-by-step until migration can converge.",
           "minimum": 0,
           "optional": 1,
           "type": "number",
           "typetext": "<number> (0 - N)"
          },
          "migrate_speed": {
           "default": 0,
           "description": "Set maximum speed (in MB/s) for migrations. Value 0 is no limit.",
           "minimum": 0,
           "optional": 1,
           "type": "integer",
           "typetext": "<integer> (0 - N)"
          },
          "name": {
           "description": "Set a name for the VM. Only used on the configuration web interface.",
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "nameserver": {
           "description": "cloud-init: Sets DNS server IP address for a container. Create will automatically use the setting from the host if neither searchdomain nor nameserver are set.",
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "net[n]": {
           "description": "Specify network devices.",
           "optional": 1,
           "type": "string",
           "typetext": "[model=]<enum> [,bridge=<bridge>] [,firewall=<1|0>] [,link_down=<1|0>] [,macaddr=<XX:XX:XX:XX:XX:XX>] [,mtu=<integer>] [,queues=<integer>] [,rate=<number>] [,tag=<integer>] [,trunks=<vlanid[;vlanid...]>] [,<model>=<macaddr>]"
          },
          "node": {
           "description": "The cluster node name.",
           "type": "string",
           "typetext": "<string>"
          },
          "numa": {
           "default": 0,
           "description": "Enable/disable NUMA.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "numa[n]": {
           "description": "NUMA topology.",
           "optional": 1,
           "type": "string",
           "typetext": "cpus=<id[-id];...> [,hostnodes=<id[-id];...>] [,memory=<number>] [,policy=<preferred|bind|interleave>]"
          },
          "onboot": {
           "default": 0,
           "description": "Specifies whether a VM will be started during system bootup.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "ostype": {
           "description": "Specify guest operating system.",
           "enum": [
            "other",
            "wxp",
            "w2k",
            "w2k3",
            "w2k8",
            "wvista",
            "win7",
            "win8",
            "win10",
            "win11",
            "l24",
            "l26",
            "solaris"
           ],
           "optional": 1,
           "type": "string",
           "verbose_description": "Specify guest operating system. This is used to enable special\noptimization/features for specific operating systems:\n\n[horizontal]\nother;; unspecified OS\nwxp;; Microsoft Windows XP\nw2k;; Microsoft Windows 2000\nw2k3;; Microsoft Windows 2003\nw2k8;; Microsoft Windows 2008\nwvista;; Microsoft Windows Vista\nwin7;; Microsoft Windows 7\nwin8;; Microsoft Windows 8/2012/2012r2\nwin10;; Microsoft Windows 10/2016/2019\nwin11;; Microsoft Windows 11/2022/2025\nl24;; Linux 2.4 Kernel\nl26;; Linux 2.6 - 6.X Kernel\nsolaris;; Solaris/OpenSolaris/OpenIndiania kernel\n"
          },
          "parallel[n]": {
           "description": "Map host parallel devices (n is 0 to 2).",
           "optional": 1,
           "pattern": "/dev/parport\\d+|/dev/usb/lp\\d+",
           "type": "string",
           "verbose_description": "Map host parallel devices (n is 0 to 2).\n\nNOTE: This option allows direct access to host hardware. So it is no longer possible to migrate such\nmachines - use with special care.\n\nCAUTION: Experimental! User reported problems with this option.\n"
          },
          "pool": {
           "description": "Add the VM to the specified pool.",
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "protection": {
           "default": 0,
           "description": "Sets the protection flag of the VM. This will disable the remove VM and remove disk operations.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "reboot": {
           "default": 1,
           "description": "Allow reboot. If set to '0' the VM exit on reboot.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "rng0": {
           "description": "Configure a VirtIO-based Random Number Generator.",
           "optional": 1,
           "type": "string",
           "typetext": "[source=]</dev/urandom|/dev/random|/dev/hwrng> [,max_bytes=<integer>] [,period=<integer>]"
          },
          "sata[n]": {
           "description": "Use volume as SATA hard disk or CD-ROM (n is 0 to 5). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
           "optional": 1,
           "type": "string",
           "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,ssd=<1|0>] [,trans=<none|lba|auto>] [,werror=<enum>] [,wwn=<wwn>]"
          },
          "scsi[n]": {
           "description": "Use volume as SCSI hard disk or CD-ROM (n is 0 to 30). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
           "optional": 1,
           "type": "string",
           "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,iothread=<1|0>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,product=<product>] [,queues=<integer>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,ro=<1|0>] [,scsiblock=<1|0>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,ssd=<1|0>] [,trans=<none|lba|auto>] [,vendor=<vendor>] [,werror=<enum>] [,wwn=<wwn>]"
          },
          "scsihw": {
           "default": "lsi",
           "description": "SCSI controller model",
           "enum": [
            "lsi",
            "lsi53c810",
            "virtio-scsi-pci",
            "virtio-scsi-single",
            "megasas",
            "pvscsi"
           ],
           "optional": 1,
           "type": "string"
          },
          "searchdomain": {
           "description": "cloud-init: Sets DNS search domains for a container. Create will automatically use the setting from the host if neither searchdomain nor nameserver are set.",
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "serial[n]": {
           "description": "Create a serial device inside the VM (n is 0 to 3)",
           "optional": 1,
           "pattern": "(/dev/.+|socket)",
           "type": "string",
           "verbose_description": "Create a serial device inside the VM (n is 0 to 3), and pass through a\nhost serial device (i.e. /dev/ttyS0), or create a unix socket on the\nhost side (use 'qm terminal' to open a terminal connection).\n\nNOTE: If you pass through a host serial device, it is no longer possible to migrate such machines -\nuse with special care.\n\nCAUTION: Experimental! User reported problems with this option.\n"
          },
          "shares": {
           "default": 1000,
           "description": "Amount of memory shares for auto-ballooning. The larger the number is, the more memory this VM gets. Number is relative to weights of all other running VMs. Using zero disables auto-ballooning. Auto-ballooning is done by pvestatd.",
           "maximum": 50000,
           "minimum": 0,
           "optional": 1,
           "type": "integer",
           "typetext": "<integer> (0 - 50000)"
          },
          "smbios1": {
           "description": "Specify SMBIOS type 1 fields.",
           "maxLength": 512,
           "optional": 1,
           "type": "string",
           "typetext": "[base64=<1|0>] [,family=<Base64 encoded string>] [,manufacturer=<Base64 encoded string>] [,product=<Base64 encoded string>] [,serial=<Base64 encoded string>] [,sku=<Base64 encoded string>] [,uuid=<UUID>] [,version=<Base64 encoded string>]"
          },
          "smp": {
           "default": 1,
           "description": "The number of CPUs. Please use option -sockets instead.",
           "minimum": 1,
           "optional": 1,
           "type": "integer",
           "typetext": "<integer> (1 - N)"
          },
          "sockets": {
           "default": 1,
           "description": "The number of CPU sockets.",
           "minimum": 1,
           "optional": 1,
           "type": "integer",
           "typetext": "<integer> (1 - N)"
          },
          "spice_enhancements": {
           "description": "Configure additional enhancements for SPICE.",
           "optional": 1,
           "type": "string",
           "typetext": "[foldersharing=<1|0>] [,videostreaming=<off|all|filter>]"
          },
          "sshkeys": {
           "description": "cloud-init: Setup public SSH keys (one key per line, OpenSSH format).",
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "start": {
           "default": 0,
           "description": "Start VM after it was created successfully.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "startdate": {
           "default": "now",
           "description": "Set the initial date of the real time clock. Valid format for date are:'now' or '2006-06-17T16:01:21' or '2006-06-17'.",
           "optional": 1,
           "pattern": "(now|\\d{4}-\\d{1,2}-\\d{1,2}(T\\d{1,2}:\\d{1,2}:\\d{1,2})?)",
           "type": "string",
           "typetext": "(now | YYYY-MM-DD | YYYY-MM-DDTHH:MM:SS)"
          },
          "startup": {
           "description": "Startup and shutdown behavior. Order is a non-negative number defining the general startup order. Shutdown in done with reverse ordering. Additionally you can set the 'up' or 'down' delay in seconds, which specifies a delay to wait before the next VM is started or stopped.",
           "optional": 1,
           "type": "string",
           "typetext": "[[order=]\\d+] [,up=\\d+] [,down=\\d+] "
          },
          "storage": {
           "description": "Default storage.",
           "format_description": "storage ID",
           "optional": 1,
           "type": "string",
           "typetext": "<storage ID>"
          },
          "tablet": {
           "default": 1,
           "description": "Enable/disable the USB tablet device.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>",
           "verbose_description": "Enable/disable the USB tablet device. This device is usually needed to allow absolute mouse positioning with VNC. Else the mouse runs out of sync with normal VNC clients. If you're running lots of console-only guests on one host, you may consider disabling this to save some context switches. This is turned off by default if you use spice (`qm set <vmid> --vga qxl`)."
          },
          "tags": {
           "description": "Tags of the VM. This is only meta information.",
           "optional": 1,
           "type": "string",
           "typetext": "<string>"
          },
          "tdf": {
           "default": 0,
           "description": "Enable/disable time drift fix.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "template": {
           "default": 0,
           "description": "Enable/disable Template.",
           "optional": 1,
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "tpmstate0": {
           "description": "Configure a Disk for storing TPM state. The format is fixed to 'raw'. Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Note that SIZE_IN_GiB is ignored here and 4 MiB will be used instead. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
           "optional": 1,
           "type": "string",
           "typetext": "[file=]<volume> [,import-from=<source volume>] [,size=<DiskSize>] [,version=<v1.2|v2.0>]"
          },
          "unique": {
           "description": "Assign a unique random ethernet address.",
           "optional": 1,
           "requires": "archive",
           "type": "boolean",
           "typetext": "<boolean>"
          },
          "unused[n]": {
           "description": "Reference to unused volumes. This is used internally, and should not be modified manually.",
           "optional": 1,
           "type": "string",
           "typetext": "[file=]<volume>"
          },
          "usb[n]": {
           "description": "Configure an USB device (n is 0 to 4, for machine version >= 7.1 and ostype l26 or windows > 7, n can be up to 14).",
           "optional": 1,
           "type": "string",
           "typetext": "[[host=]<HOSTUSBDEVICE|spice>] [,mapping=<mapping-id>] [,usb3=<1|0>]"
          },
          "vcpus": {
           "default": 0,
           "description": "Number of hotplugged vcpus.",
           "minimum": 1,
           "optional": 1,
           "type": "integer",
           "typetext": "<integer> (1 - N)"
          },
          "vga": {
           "description": "Configure the VGA hardware.",
           "optional": 1,
           "type": "string",
           "typetext": "[[type=]<enum>] [,clipboard=<vnc>] [,memory=<integer>]",
           "verbose_description": "Configure the VGA Hardware. If you want to use high resolution modes (>= 1280x1024x16) you may need to increase the vga memory option. Since QEMU 2.9 the default VGA display type is 'std' for all OS types besides some Windows versions (XP and older) which use 'cirrus'. The 'qxl' option enables the SPICE display server. For win* OS you can select how many independent displays you want, Linux guests can add displays them self.\nYou can also run without any graphic card, using a serial device as terminal."
          },
          "virtio[n]": {
           "description": "Use volume as VIRTIO hard disk (n is 0 to 15). Use the special syntax STORAGE_ID:SIZE_IN_GiB to allocate a new volume. Use STORAGE_ID:0 and the 'import-from' parameter to import from an existing volume.",
           "optional": 1,
           "type": "string",
           "typetext": "[file=]<volume> [,aio=<native|threads|io_uring>] [,backup=<1|0>] [,bps=<bps>] [,bps_max_length=<seconds>] [,bps_rd=<bps>] [,bps_rd_max_length=<seconds>] [,bps_wr=<bps>] [,bps_wr_max_length=<seconds>] [,cache=<enum>] [,cyls=<integer>] [,detect_zeroes=<1|0>] [,discard=<ignore|on>] [,format=<enum>] [,heads=<integer>] [,import-from=<source volume>] [,iops=<iops>] [,iops_max=<iops>] [,iops_max_length=<seconds>] [,iops_rd=<iops>] [,iops_rd_max=<iops>] [,iops_rd_max_length=<seconds>] [,iops_wr=<iops>] [,iops_wr_max=<iops>] [,iops_wr_max_length=<seconds>] [,iothread=<1|0>] [,mbps=<mbps>] [,mbps_max=<mbps>] [,mbps_rd=<mbps>] [,mbps_rd_max=<mbps>] [,mbps_wr=<mbps>] [,mbps_wr_max=<mbps>] [,media=<cdrom|disk>] [,replicate=<1|0>] [,rerror=<ignore|report|stop>] [,ro=<1|0>] [,secs=<integer>] [,serial=<serial>] [,shared=<1|0>] [,size=<DiskSize>] [,snapshot=<1|0>] [,trans=<none|lba|auto>] [,werror=<enum>]"
          },
          "virtiofs[n]": {
           "description": "Configuration for sharing a directory between host and guest using Virtio-fs.",
           "optional": 1,
           "type": "string",
           "typetext": "[dirid=]<mapping-id> [,cache=<enum>] [,direct-io=<1|0>] [,expose-acl=<1|0>] [,expose-xattr=<1|0>]"
          },
          "vmgenid": {
           "default": "1 (autogenerated)",
           "description": "Set VM Generation ID. Use '1' to autogenerate on create or update, pass '0' to disable explicitly.",
           "format_description": "UUID",
           "optional": 1,
           "pattern": "(?:[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}|[01])",
           "type": "string",
           "verbose_description": "The VM generation ID (vmgenid) device exposes a 128-bit integer value identifier to the guest OS. This allows to notify the guest operating system when the virtual machine is executed with a different configuration (e.g. snapshot execution or creation from a template). The guest operating system notices the change, and is then able to react as appropriate by marking its copies of distributed databases as dirty, re-initializing its random number generator, etc.\nNote that auto-creation only works when done through API/CLI create or update methods, but not when manually editing the config file."
          },
          "vmid": {
           "description": "The (unique) ID of the VM.",
           "maximum": 999999999,
           "minimum": 100,
           "type": "integer",
           "typetext": "<integer> (100 - 999999999)"
          },
          "vmstatestorage": {
           "description": "Default storage for VM state volumes/files.",
           "format_description": "storage ID",
           "optional": 1,
           "type": "string",
           "typetext": "<storage ID>"
          },
          "watchdog": {
           "description": "Create a virtual hardware watchdog device.",
           "optional": 1,
           "type": "string",
           "typetext": "[[model=]<i6300esb|ib700>] [,action=<enum>]",
           "verbose_description": "Create a virtual hardware watchdog device. Once enabled (by a guest action), the watchdog must be periodically polled by an agent inside the guest or else the watchdog will reset the guest (or execute the respective action specified)"
          }
         }
        },
        "permissions": {
         "description": "You need 'VM.Allocate' permissions on /vms/{vmid} or on the VM pool /pool/{pool}. For restore (option 'archive'), it is enough if the user has 'VM.Backup' permission and the VM already exists. If you create disks you need 'Datastore.AllocateSpace' on any used storage.If you use a bridge/vlan, you need 'SDN.Use' on any used bridge/vlan.",
         "user": "all"
        },
        "protected": 1,
        "proxyto": "node"
       }
      },
      "leaf": 0,
      "path": "/nodes/{node}/qemu",
      "text": "qemu"
     },
     {
      "children": [
       {
        "info": {
         "GET": {
          "allowtoken": 1,
          "description": "Get ceph status.",
          "method": "GET",
          "name": "status",
          "parameters": {
           "additionalProperties": 0,
           "properties": {
            "node": {
             "description": "The cluster node name.",
             "type": "string",
             "typetext": "<string>"
            }
           }
          },
          "permissions": {
           "check": [
            "perm",
            "/",
            [
             "Sys.Audit",
             "Datastore.Audit"
            ],
            "any",
            1
           ]
          },
          "protected": 1,
          "proxyto": "node"
         }
        },
        "leaf": 1,
        "path": "/nodes/{node}/ceph/status",
        "text": "status"
       }
      ],
      "leaf": 0,
      "path": "/nodes/{node}/ceph",
      "text": "ceph"
     }
    ],
    "leaf": 0,
    "path": "/nodes/{node}",
    "text": "{node}"
   }
  ],
  "info": {
   "GET": {
    "allowtoken": 1,
    "description": "Cluster node index.",
    "method": "GET",
    "name": "index",
    "parameters": {
     "additionalProperties": 0
    },
    "permissions": {
     "user": "all"
    }
   }
  },
  "leaf": 0,
  "path": "/nodes",
  "text": "nodes"
 },
 {
  "info": {
   "GET": {
    "allowtoken": 1,
    "description": "API version details, including some parts of the global datacenter config.",
    "method": "GET",
    "name": "version",
    "parameters": {
     "additionalProperties": 0
    },
    "permissions": {
     "user": "all"
    }
   }
  },
  "leaf": 1,
  "path": "/version",
  "text": "version"
 }
]
;
Ext.onReady(function(){});
