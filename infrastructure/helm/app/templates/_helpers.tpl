# ============================================
# HappyLanding App Helm Chart
# ============================================
# 用途：部署 Frontend (React) + Backend (FastAPI) 到 EKS
# 模板：deployment.yaml / service.yaml / ingress.yaml / _helpers.tpl
# ============================================

apiVersion: v2
name: happylanding
description: HappyLanding Knowledge Management Platform
type: application
version: 1.0.0
appVersion: "1.0.0"
keywords:
  - knowledge-management
  - search
  - ai
  - graph
maintainers:
  - name: HappyLanding Team

---
# ============================================
# Helpers（模板工具函数）
# ============================================

{{- define "happylanding.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "happylanding.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "happylanding.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "happylanding.labels" -}}
helm.sh/chart: {{ include "happylanding.chart" . }}
{{ include "happylanding.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "happylanding.selectorLabels" -}}
app.kubernetes.io/name: {{ include "happylanding.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}