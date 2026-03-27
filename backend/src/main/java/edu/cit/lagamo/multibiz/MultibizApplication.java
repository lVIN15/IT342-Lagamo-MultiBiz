package edu.cit.lagamo.multibiz;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MultibizApplication {

	public static void main(String[] args) {
		SpringApplication.run(MultibizApplication.class, args);
	}

}
