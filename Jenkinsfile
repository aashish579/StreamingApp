pipeline {
    agent any

    environment {
        IMAGE_TAG = "1.0.${BUILD_NUMBER}"
        DOCKERHUB_USER = "aashish579"
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Verify Tooling') {
    steps {
        sh 'docker --version'
        sh 'kubectl version --client'
        sh 'helm version --short'

        sh '''
            echo "Checking AWS CLI:"
            aws --version

            echo "Checking AWS credential source:"
            aws configure list

            echo "Checking AWS authentication:"
            aws sts get-caller-identity || true
        '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker build -t ${DOCKERHUB_USER}/streaming-auth:${IMAGE_TAG} backend/authService'
                sh 'docker build -t ${DOCKERHUB_USER}/streaming-stream:${IMAGE_TAG} -f backend/streamingService/Dockerfile backend'
                sh 'docker build -t ${DOCKERHUB_USER}/streaming-admin:${IMAGE_TAG} -f backend/adminService/Dockerfile backend'
                sh 'docker build -t ${DOCKERHUB_USER}/streaming-chat:${IMAGE_TAG} -f backend/chatService/Dockerfile backend'
                sh '''docker build -t ${DOCKERHUB_USER}/streaming-frontend:${IMAGE_TAG} \\
                  --build-arg REACT_APP_AUTH_API_URL=http://localhost/api \\
                  --build-arg REACT_APP_STREAMING_API_URL=http://localhost/api \\
                  --build-arg REACT_APP_STREAMING_PUBLIC_URL=http://localhost/api/streaming \\
                  --build-arg REACT_APP_ADMIN_API_URL=http://localhost/api/admin \\
                  --build-arg REACT_APP_CHAT_API_URL=http://localhost/api/chat \\
                  --build-arg REACT_APP_CHAT_SOCKET_URL=http://localhost \\
                  frontend'''
            }
        }

        stage('Validate Helm') {
            steps {
                sh 'helm lint streamingapp'
                sh 'helm template streamingapp streamingapp > /tmp/streamingapp-rendered.yaml'
                sh "grep -n '/socket.io' /tmp/streamingapp-rendered.yaml"
            }
        }

        stage('Push Docker Hub Images') {
            when { expression { return env.DOCKERHUB_CREDS_ID?.trim() } }
            steps {
                withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDS_ID, usernameVariable: 'DH_USER', passwordVariable: 'DH_TOKEN')]) {
                    sh 'echo "$DH_TOKEN" | docker login -u "$DH_USER" --password-stdin'
                    sh 'docker push ${DOCKERHUB_USER}/streaming-auth:${IMAGE_TAG}'
                    sh 'docker push ${DOCKERHUB_USER}/streaming-stream:${IMAGE_TAG}'
                    sh 'docker push ${DOCKERHUB_USER}/streaming-admin:${IMAGE_TAG}'
                    sh 'docker push ${DOCKERHUB_USER}/streaming-chat:${IMAGE_TAG}'
                    sh 'docker push ${DOCKERHUB_USER}/streaming-frontend:${IMAGE_TAG}'

        stage('Verify AWS Authentication') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'streamflix-aws-deploy'
                ]]) {
                    sh '''
                        set +x
                        aws sts get-caller-identity \
                          --query "{Account:Account,Arn:Arn}" \
                          --output json
                    '''
                }
            }
        }
    }

    post {
        success { echo "StreamingApp CI completed successfully: ${IMAGE_TAG}" }
        failure { echo 'StreamingApp CI failed. Review the stage logs above.' }
    }
}
