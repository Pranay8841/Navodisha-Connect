package com.navodishaConnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

@SpringBootApplication
public class NavodishaConnectBackendApplication {

	public static void main(String[] args) {
		ApplicationContext context = SpringApplication.run(NavodishaConnectBackendApplication.class, args);
		System.out.println("=================================================");
		System.out.println("Navodisha Connect Backend started successfully!");
		System.out.println("Total beans initialized in IoC Container: " + context.getBeanDefinitionCount());
		System.out.println("=================================================");
	}

}

